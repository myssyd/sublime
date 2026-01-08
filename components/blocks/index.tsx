"use client";

import React from "react";
import type {
  BlockComposition,
  BlockDefinition,
  BlockType,
  Theme,
} from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

// Block component imports - Layout
import { SectionBlock } from "./layout/section";
import { ContainerBlock } from "./layout/container";
import { GridBlock } from "./layout/grid";
import { FlexBlock } from "./layout/flex";
import { ColumnsBlock } from "./layout/columns";

// Block component imports - Content
import { HeadingBlock } from "./content/heading";
import { TextBlock } from "./content/text";
import { ImageBlock } from "./content/image";
import { IconBlock } from "./content/icon";
import { LinkBlock } from "./content/link";
import { DividerBlock } from "./content/divider";
import { SpacerBlock } from "./content/spacer";

// Block component imports - Interactive
import { ButtonBlock } from "./interactive/button";
import { ButtonGroupBlock } from "./interactive/button-group";
import { InputBlock } from "./interactive/input";
import { TextareaBlock } from "./interactive/textarea";
import { SelectBlock } from "./interactive/select";
import { FormBlock } from "./interactive/form";

// Block component imports - Composite
import { CardBlock } from "./composite/card";
import { FeatureCardBlock } from "./composite/feature-card";
import { PricingCardBlock } from "./composite/pricing-card";
import { TestimonialCardBlock } from "./composite/testimonial-card";
import { StatCardBlock } from "./composite/stat-card";
import { TeamMemberCardBlock } from "./composite/team-member-card";
import { NavBarBlock } from "./composite/nav-bar";
import { FooterBlockComponent } from "./composite/footer-block";
import { HeroBlockComponent } from "./composite/hero-block";
import { CtaBlockComponent } from "./composite/cta-block";
import { FaqItemBlock } from "./composite/faq-item";
import { LogoCloudBlock } from "./composite/logo-cloud";

// ============================================================================
// Block Renderer Props
// ============================================================================

export interface BlockRendererProps<T extends BlockType = BlockType> {
  block: BlockDefinition<T>;
  theme: Theme;
  children?: React.ReactNode;
  isEditing?: boolean;
  isSelected?: boolean;
  onSelect?: (blockId: string) => void;
  onDoubleClick?: (blockId: string) => void;
}

// ============================================================================
// Block Component Registry
// ============================================================================

type BlockComponent = React.ComponentType<BlockRendererProps<any>>;

const blockComponents: Record<BlockType, BlockComponent> = {
  // Layout
  section: SectionBlock,
  container: ContainerBlock,
  grid: GridBlock,
  flex: FlexBlock,
  columns: ColumnsBlock,
  // Content
  heading: HeadingBlock,
  text: TextBlock,
  image: ImageBlock,
  icon: IconBlock,
  link: LinkBlock,
  divider: DividerBlock,
  spacer: SpacerBlock,
  // Interactive
  button: ButtonBlock,
  "button-group": ButtonGroupBlock,
  input: InputBlock,
  textarea: TextareaBlock,
  select: SelectBlock,
  form: FormBlock,
  // Composite
  card: CardBlock,
  "feature-card": FeatureCardBlock,
  "pricing-card": PricingCardBlock,
  "testimonial-card": TestimonialCardBlock,
  "stat-card": StatCardBlock,
  "team-member-card": TeamMemberCardBlock,
  "nav-bar": NavBarBlock,
  "footer-block": FooterBlockComponent,
  "hero-block": HeroBlockComponent,
  "cta-block": CtaBlockComponent,
  "faq-item": FaqItemBlock,
  "logo-cloud": LogoCloudBlock,
};

// ============================================================================
// Block Composition Renderer
// ============================================================================

export interface BlockCompositionRendererProps {
  composition: BlockComposition;
  theme: Theme;
  isEditing?: boolean;
  selectedBlockId?: string | null;
  onBlockSelect?: (blockId: string) => void;
  onBlockDoubleClick?: (blockId: string) => void;
  className?: string;
}

export function BlockCompositionRenderer({
  composition,
  theme,
  isEditing = false,
  selectedBlockId = null,
  onBlockSelect,
  onBlockDoubleClick,
  className,
}: BlockCompositionRendererProps) {
  const renderBlock = (blockId: string): React.ReactNode => {
    const block = composition.blocks[blockId];
    if (!block) {
      console.warn(`Block not found: ${blockId}`);
      return null;
    }

    const Component = blockComponents[block.type];
    if (!Component) {
      console.warn(`Unknown block type: ${block.type}`);
      return (
        <div
          key={blockId}
          className="p-4 bg-red-100 text-red-700 rounded"
          data-block-id={blockId}
        >
          Unknown block type: {block.type}
        </div>
      );
    }

    // Recursively render children for container blocks
    const children = block.children?.map((childId) => renderBlock(childId));

    return (
      <Component
        key={blockId}
        block={block}
        theme={theme}
        isEditing={isEditing}
        isSelected={selectedBlockId === blockId}
        onSelect={() => onBlockSelect?.(blockId)}
        onDoubleClick={() => onBlockDoubleClick?.(blockId)}
      >
        {children}
      </Component>
    );
  };

  return (
    <div className={cn("block-composition", className)}>
      {renderBlock(composition.root)}
    </div>
  );
}

// ============================================================================
// Single Block Renderer (for previews, etc.)
// ============================================================================

export interface SingleBlockRendererProps {
  block: BlockDefinition;
  theme: Theme;
  className?: string;
}

export function SingleBlockRenderer({
  block,
  theme,
  className,
}: SingleBlockRendererProps) {
  const Component = blockComponents[block.type];
  if (!Component) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Unknown block type: {block.type}
      </div>
    );
  }

  return (
    <div className={className}>
      <Component block={block} theme={theme} />
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { blockComponents };
