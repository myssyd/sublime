# PR: Phase 3 - Visual Block Editor Implementation

## Summary

This PR implements **Phase 3: Visual Block Editor** of the Sublime v2 block-based page builder architecture. It introduces a complete drag-and-drop visual editor for composing pages using the block system.

## Changes

### New Components

#### Block Editor Components (`components/block-editor/`)

1. **`BlockPalette.tsx`** - Draggable block library
   - Search functionality to filter blocks by name/description
   - Category-based organization (Layout, Content, Interactive, Composite)
   - Draggable blocks using `@dnd-kit`
   - Compact variant for sidebar use

2. **`BlockCanvas.tsx`** - Visual editing canvas
   - Drop zones for receiving blocks from palette
   - Editable block wrappers with selection highlighting
   - Empty state with guidance for new users
   - Live preview component for render mode
   - Nested block rendering with depth indicators

3. **`BlockPropsPanel.tsx`** - Property editor panel
   - Dynamic property editors based on block type:
     - Text inputs
     - Textarea for long content
     - Number inputs
     - Boolean switches
     - Select dropdowns
     - Color pickers
   - Style overrides with Tailwind classes
   - Delete and duplicate actions
   - Block ID display (read-only)

4. **`BlockTreeView.tsx`** - Hierarchy navigation panel
   - Tree structure view of all blocks
   - Expand/collapse functionality
   - Move up/down actions
   - Duplicate and delete actions
   - Visual selection indicator

5. **`index.tsx`** - Barrel export file

#### UI Components (`components/ui/`)

1. **`switch.tsx`** - Toggle switch component using `@radix-ui/react-switch`
2. **`resizable.tsx`** - Resizable panel components (using `react-resizable-panels` v4)

### New Pages

#### Block Editor Page (`app/(app)/websites/[websiteId]/[pageId]/editor/page.tsx`)

Full-featured visual editor with:
- **Three-panel layout**:
  - Left: Block palette / Layers tree (switchable tabs)
  - Center: Visual canvas with drop zones
  - Right: Property editor panel
- **Edit/Preview mode toggle**
- **Viewport selector**: Desktop, Tablet, Mobile previews
- **Full @dnd-kit integration** for drag-and-drop
- **Real-time composition updates** saved to database via Convex

#### Test Editor Page (`app/(app)/test-editor/page.tsx`)

Quick test route that:
- Creates a test website if needed
- Creates a test page
- Redirects to the new block editor

### Schema Updates

#### `convex/schema.ts`
- Added `borderRadius` field to legacy `landingPages` theme validator to support existing data:
  ```typescript
  borderRadius: v.optional(v.union(v.string(), v.number()))
  ```

### Bug Fixes & Improvements

#### Removed Page Limits (Development)
Commented out page creation limits in:
- `convex/landingPages.ts`
- `convex/agents/mutations.ts`
- `convex/agents/actions.ts`

This allows unlimited page creation during development. Limits should be re-enabled before production.

#### Type Fixes
- Fixed various TypeScript errors related to block props typing
- Added type assertions for dynamic block creation
- Fixed `BlockPropsPanel` prop access with proper type casting

### Dependencies Added

```json
{
  "react-resizable-panels": "^4.0.3",
  "@radix-ui/react-switch": "^1.2.6"
}
```

## File Changes Summary

### New Files
```
components/block-editor/
├── index.tsx
├── BlockPalette.tsx
├── BlockCanvas.tsx
├── BlockPropsPanel.tsx
└── BlockTreeView.tsx

components/ui/
├── switch.tsx
└── resizable.tsx

app/(app)/
├── test-editor/page.tsx
└── websites/[websiteId]/[pageId]/editor/page.tsx
```

### Modified Files
```
convex/schema.ts                 # Added borderRadius to landingPages theme
convex/landingPages.ts           # Disabled page limits
convex/agents/mutations.ts       # Disabled page limits
convex/agents/actions.ts         # Disabled page limits
package.json                     # New dependencies
bun.lock                         # Updated lockfile
```

## Testing

1. Start the dev server: `bun dev`
2. Navigate to `http://localhost:3000/test-editor`
3. This will create test data and redirect to the block editor
4. Test features:
   - Drag blocks from left panel to canvas
   - Select blocks to see properties in right panel
   - Edit block properties
   - Switch between "Blocks" and "Layers" tabs
   - Toggle Edit/Preview mode
   - Change viewport size

## Screenshots

The editor provides a three-panel layout:
- **Left Panel (256px)**: Block palette with search and categories, or layer tree view
- **Center Panel (flexible)**: Canvas for visual editing with drop zones
- **Right Panel (288px)**: Property editor for selected block

## Next Steps (Phase 4+)

- [ ] Implement block reordering via drag within canvas
- [ ] Add undo/redo functionality
- [ ] Implement AI-assisted block editing
- [ ] Add website dashboard page
- [ ] Add page management UI
- [ ] Implement navigation system
- [ ] Add export to static HTML

## Notes

- The `react-resizable-panels` v4 had API compatibility issues, so the editor currently uses fixed-width panels with flexbox. Resizable panels can be revisited later.
- Page limits are disabled for development - remember to re-enable before production deployment.
