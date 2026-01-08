import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ============================================================================
// Queries
// ============================================================================

export const listByPage = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const sections = await ctx.db
      .query("pageSections")
      .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
      .collect();

    // Sort by order
    sections.sort((a, b) => a.order - b.order);

    return sections;
  },
});

export const get = query({
  args: { id: v.id("pageSections") },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    return section;
  },
});

// ============================================================================
// Mutations
// ============================================================================

export const create = mutation({
  args: {
    pageId: v.id("pages"),
    name: v.optional(v.string()),
    composition: v.object({
      root: v.string(),
      blocks: v.any(),
    }),
    order: v.optional(v.number()),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const page = await ctx.db.get(args.pageId);
    if (!page) throw new Error("Page not found");

    // Get current max order if not specified
    let order = args.order;
    if (order === undefined) {
      const existingSections = await ctx.db
        .query("pageSections")
        .withIndex("by_page", (q) => q.eq("pageId", args.pageId))
        .collect();

      order =
        existingSections.length > 0
          ? Math.max(...existingSections.map((s) => s.order)) + 1
          : 0;
    }

    const sectionId = await ctx.db.insert("pageSections", {
      pageId: args.pageId,
      name: args.name,
      composition: args.composition,
      order,
      isVisible: args.isVisible ?? true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return sectionId;
  },
});

export const update = mutation({
  args: {
    id: v.id("pageSections"),
    name: v.optional(v.string()),
    composition: v.optional(
      v.object({
        root: v.string(),
        blocks: v.any(),
      })
    ),
    isVisible: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const section = await ctx.db.get(id);
    if (!section) throw new Error("Section not found");

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

export const updateComposition = mutation({
  args: {
    id: v.id("pageSections"),
    composition: v.object({
      root: v.string(),
      blocks: v.any(),
    }),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    await ctx.db.patch(args.id, {
      composition: args.composition,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const updateBlock = mutation({
  args: {
    id: v.id("pageSections"),
    blockId: v.string(),
    updates: v.object({
      props: v.optional(v.any()),
      styleOverrides: v.optional(v.string()),
      children: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    const composition = section.composition;
    const block = composition.blocks[args.blockId];

    if (!block) throw new Error("Block not found");

    // Update the block
    composition.blocks[args.blockId] = {
      ...block,
      ...(args.updates.props && { props: { ...block.props, ...args.updates.props } }),
      ...(args.updates.styleOverrides !== undefined && {
        styleOverrides: args.updates.styleOverrides,
      }),
      ...(args.updates.children && { children: args.updates.children }),
    };

    await ctx.db.patch(args.id, {
      composition,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const addBlock = mutation({
  args: {
    id: v.id("pageSections"),
    parentBlockId: v.string(),
    block: v.object({
      id: v.string(),
      type: v.string(),
      props: v.any(),
      children: v.optional(v.array(v.string())),
      styleOverrides: v.optional(v.string()),
    }),
    insertIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    const composition = section.composition;
    const parentBlock = composition.blocks[args.parentBlockId];

    if (!parentBlock) throw new Error("Parent block not found");

    // Add the new block to blocks
    composition.blocks[args.block.id] = args.block;

    // Add to parent's children
    const children = parentBlock.children || [];
    if (args.insertIndex !== undefined) {
      children.splice(args.insertIndex, 0, args.block.id);
    } else {
      children.push(args.block.id);
    }
    composition.blocks[args.parentBlockId] = {
      ...parentBlock,
      children,
    };

    await ctx.db.patch(args.id, {
      composition,
      updatedAt: Date.now(),
    });

    return args.block.id;
  },
});

export const removeBlock = mutation({
  args: {
    id: v.id("pageSections"),
    blockId: v.string(),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    const composition = section.composition;

    if (args.blockId === composition.root) {
      throw new Error("Cannot remove root block");
    }

    // Find and remove from parent's children
    for (const [id, block] of Object.entries(composition.blocks) as [string, any][]) {
      if (block.children?.includes(args.blockId)) {
        composition.blocks[id] = {
          ...block,
          children: block.children.filter((c: string) => c !== args.blockId),
        };
        break;
      }
    }

    // Remove the block and its children recursively
    const removeBlockAndChildren = (blockId: string) => {
      const block = composition.blocks[blockId];
      if (block?.children) {
        for (const childId of block.children) {
          removeBlockAndChildren(childId);
        }
      }
      delete composition.blocks[blockId];
    };

    removeBlockAndChildren(args.blockId);

    await ctx.db.patch(args.id, {
      composition,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const moveBlock = mutation({
  args: {
    id: v.id("pageSections"),
    blockId: v.string(),
    newParentId: v.string(),
    newIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    const composition = section.composition;

    // Remove from old parent
    for (const [id, block] of Object.entries(composition.blocks) as [string, any][]) {
      if (block.children?.includes(args.blockId)) {
        composition.blocks[id] = {
          ...block,
          children: block.children.filter((c: string) => c !== args.blockId),
        };
        break;
      }
    }

    // Add to new parent
    const newParent = composition.blocks[args.newParentId];
    if (!newParent) throw new Error("New parent block not found");

    const children = newParent.children || [];
    children.splice(args.newIndex, 0, args.blockId);
    composition.blocks[args.newParentId] = {
      ...newParent,
      children,
    };

    await ctx.db.patch(args.id, {
      composition,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});

export const remove = mutation({
  args: { id: v.id("pageSections") },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    await ctx.db.delete(args.id);

    return args.id;
  },
});

export const duplicate = mutation({
  args: { id: v.id("pageSections") },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    // Get max order for this page
    const existingSections = await ctx.db
      .query("pageSections")
      .withIndex("by_page", (q) => q.eq("pageId", section.pageId))
      .collect();

    const maxOrder = Math.max(...existingSections.map((s) => s.order));

    // Generate new IDs for all blocks
    const idMap: Record<string, string> = {};
    const newBlocks: Record<string, any> = {};

    for (const [oldId] of Object.entries(section.composition.blocks) as [string, any][]) {
      const newId = `${oldId}-copy-${Date.now()}`;
      idMap[oldId] = newId;
    }

    for (const [oldId, block] of Object.entries(section.composition.blocks) as [string, any][]) {
      const newId = idMap[oldId];
      newBlocks[newId] = {
        ...block,
        id: newId,
        children: block.children?.map((c: string) => idMap[c]),
      };
    }

    const newSectionId = await ctx.db.insert("pageSections", {
      pageId: section.pageId,
      name: section.name ? `${section.name} (Copy)` : undefined,
      composition: {
        root: idMap[section.composition.root],
        blocks: newBlocks,
      },
      order: maxOrder + 1,
      isVisible: section.isVisible,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return newSectionId;
  },
});

export const reorder = mutation({
  args: {
    pageId: v.id("pages"),
    sectionIds: v.array(v.id("pageSections")),
  },
  handler: async (ctx, args) => {
    for (let i = 0; i < args.sectionIds.length; i++) {
      await ctx.db.patch(args.sectionIds[i], {
        order: i,
        updatedAt: Date.now(),
      });
    }

    return args.sectionIds;
  },
});

export const toggleVisibility = mutation({
  args: { id: v.id("pageSections") },
  handler: async (ctx, args) => {
    const section = await ctx.db.get(args.id);
    if (!section) throw new Error("Section not found");

    await ctx.db.patch(args.id, {
      isVisible: !section.isVisible,
      updatedAt: Date.now(),
    });

    return args.id;
  },
});
