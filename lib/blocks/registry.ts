import type { z } from "zod";
import type { BlockType, BlockCategory, BlockPropsMap } from "./types";
import { blockPropsSchemas } from "./schemas";

// ============================================================================
// Block Metadata
// ============================================================================

export interface BlockMetadata<T extends BlockType = BlockType> {
  type: T;
  name: string;
  description: string;
  icon: string; // Hugeicon name
  category: BlockCategory;
  canHaveChildren: boolean;
  maxChildren?: number;
  allowedChildren?: BlockType[];
  allowedParents?: BlockType[];
  defaultProps: Partial<BlockPropsMap[T]>;
}

// ============================================================================
// Block Registry
// ============================================================================

export const blockRegistry: Record<BlockType, BlockMetadata> = {
  // -------------------------------------------------------------------------
  // Layout Blocks
  // -------------------------------------------------------------------------
  section: {
    type: "section",
    name: "Section",
    description: "A full-width page section with configurable padding and background",
    icon: "LayoutTopIcon",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      as: "section",
      maxWidth: "xl",
      padding: "lg",
      background: "none",
    },
  },
  container: {
    type: "container",
    name: "Container",
    description: "A centered container with max-width constraint",
    icon: "SquareIcon",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      as: "div",
      maxWidth: "xl",
      padding: "md",
      centered: true,
    },
  },
  grid: {
    type: "grid",
    name: "Grid",
    description: "Responsive grid layout for arranging items in columns",
    icon: "LayoutGridIcon",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      columns: 3,
      gap: "md",
      alignItems: "stretch",
    },
  },
  flex: {
    type: "flex",
    name: "Flex",
    description: "Flexible box layout for horizontal or vertical arrangement",
    icon: "LayoutLeftIcon",
    category: "layout",
    canHaveChildren: true,
    defaultProps: {
      direction: "row",
      gap: "md",
      justify: "start",
      align: "center",
      wrap: false,
    },
  },
  columns: {
    type: "columns",
    name: "Columns",
    description: "Pre-defined column layouts (e.g., 1:1, 1:2, 2:1)",
    icon: "LayoutColumnIcon",
    category: "layout",
    canHaveChildren: true,
    maxChildren: 3,
    defaultProps: {
      layout: "1-1",
      gap: "md",
      verticalAlign: "top",
      stackOn: "md",
    },
  },

  // -------------------------------------------------------------------------
  // Content Blocks
  // -------------------------------------------------------------------------
  heading: {
    type: "heading",
    name: "Heading",
    description: "Text heading from H1 to H6",
    icon: "Heading01Icon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      level: 2,
      text: "Heading",
      align: "left",
    },
  },
  text: {
    type: "text",
    name: "Text",
    description: "Paragraph or inline text",
    icon: "TextIcon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      text: "Your text here...",
      as: "p",
      size: "base",
      align: "left",
      muted: false,
    },
  },
  image: {
    type: "image",
    name: "Image",
    description: "Responsive image with configurable aspect ratio",
    icon: "Image01Icon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      src: "",
      alt: "",
      objectFit: "cover",
      rounded: "md",
      aspectRatio: "auto",
    },
  },
  icon: {
    type: "icon",
    name: "Icon",
    description: "Single icon from the Hugeicons library",
    icon: "StarIcon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      name: "StarIcon",
      size: "md",
      color: "inherit",
    },
  },
  link: {
    type: "link",
    name: "Link",
    description: "Text hyperlink",
    icon: "Link01Icon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      text: "Link text",
      href: "#",
      isExternal: false,
      variant: "default",
    },
  },
  divider: {
    type: "divider",
    name: "Divider",
    description: "Horizontal or vertical line separator",
    icon: "MinusSignIcon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      orientation: "horizontal",
      variant: "solid",
      spacing: "md",
    },
  },
  spacer: {
    type: "spacer",
    name: "Spacer",
    description: "Empty space for layout control",
    icon: "ExpandIcon",
    category: "content",
    canHaveChildren: false,
    defaultProps: {
      size: "md",
    },
  },

  // -------------------------------------------------------------------------
  // Interactive Blocks
  // -------------------------------------------------------------------------
  button: {
    type: "button",
    name: "Button",
    description: "Clickable button or link styled as button",
    icon: "CursorClick01Icon",
    category: "interactive",
    canHaveChildren: false,
    defaultProps: {
      text: "Click me",
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
  "button-group": {
    type: "button-group",
    name: "Button Group",
    description: "Group of buttons with consistent spacing",
    icon: "MoreHorizontalIcon",
    category: "interactive",
    canHaveChildren: true,
    allowedChildren: ["button"],
    defaultProps: {
      align: "start",
      direction: "row",
      gap: "md",
    },
  },
  input: {
    type: "input",
    name: "Input",
    description: "Text input field with label",
    icon: "TextFieldIcon",
    category: "interactive",
    canHaveChildren: false,
    defaultProps: {
      name: "input",
      type: "text",
      required: false,
    },
  },
  textarea: {
    type: "textarea",
    name: "Textarea",
    description: "Multi-line text input",
    icon: "AlignBoxBottomLeftIcon",
    category: "interactive",
    canHaveChildren: false,
    defaultProps: {
      name: "textarea",
      rows: 4,
      required: false,
    },
  },
  select: {
    type: "select",
    name: "Select",
    description: "Dropdown select input",
    icon: "ArrowDown01Icon",
    category: "interactive",
    canHaveChildren: false,
    defaultProps: {
      name: "select",
      options: [{ value: "option1", label: "Option 1" }],
      required: false,
    },
  },
  form: {
    type: "form",
    name: "Form",
    description: "Form container with submit handling",
    icon: "TaskEdit01Icon",
    category: "interactive",
    canHaveChildren: true,
    allowedChildren: ["input", "textarea", "select", "button", "flex", "grid"],
    defaultProps: {
      method: "POST",
      submitText: "Submit",
    },
  },

  // -------------------------------------------------------------------------
  // Composite Blocks
  // -------------------------------------------------------------------------
  card: {
    type: "card",
    name: "Card",
    description: "Content card with optional image, title, and description",
    icon: "NoteIcon",
    category: "composite",
    canHaveChildren: true,
    defaultProps: {
      variant: "default",
    },
  },
  "feature-card": {
    type: "feature-card",
    name: "Feature Card",
    description: "Feature highlight with icon, title, and description",
    icon: "CheckmarkBadge01Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      icon: "Rocket01Icon",
      title: "Feature Title",
      description: "Feature description goes here.",
    },
  },
  "pricing-card": {
    type: "pricing-card",
    name: "Pricing Card",
    description: "Pricing tier with name, price, features, and CTA",
    icon: "CreditCardIcon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      name: "Pro",
      price: "$29",
      period: "/month",
      features: ["Feature 1", "Feature 2", "Feature 3"],
      ctaText: "Get Started",
      ctaHref: "#",
      highlighted: false,
    },
  },
  "testimonial-card": {
    type: "testimonial-card",
    name: "Testimonial",
    description: "Customer testimonial with quote, author, and optional avatar",
    icon: "QuoteUpIcon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      quote: "This product is amazing!",
      author: "John Doe",
      role: "CEO",
      company: "Company Inc.",
    },
  },
  "stat-card": {
    type: "stat-card",
    name: "Stat Card",
    description: "Metric display with value, label, and optional trend",
    icon: "Analytics01Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      value: "100+",
      label: "Customers",
    },
  },
  "team-member-card": {
    type: "team-member-card",
    name: "Team Member",
    description: "Team member profile with photo, name, role, and social links",
    icon: "UserIcon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      name: "Jane Doe",
      role: "Designer",
    },
  },
  "nav-bar": {
    type: "nav-bar",
    name: "Navigation Bar",
    description: "Site navigation header with logo, links, and CTA",
    icon: "Menu01Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      links: [
        { label: "Home", href: "/" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
      sticky: true,
      transparent: false,
    },
  },
  "footer-block": {
    type: "footer-block",
    name: "Footer",
    description: "Site footer with links, social icons, and copyright",
    icon: "LayoutBottomIcon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      copyright: "© 2024 Your Company. All rights reserved.",
    },
  },
  "hero-block": {
    type: "hero-block",
    name: "Hero Section",
    description: "Full hero section with headline, subheadline, and CTAs",
    icon: "Home01Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      headline: "Build Something Amazing",
      subheadline: "The best way to create beautiful landing pages",
      primaryCta: { text: "Get Started", href: "#" },
      alignment: "center",
      minHeight: "half",
      imagePosition: "none",
    },
  },
  "cta-block": {
    type: "cta-block",
    name: "CTA Section",
    description: "Call-to-action section with headline and buttons",
    icon: "Megaphone01Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      headline: "Ready to get started?",
      subheadline: "Join thousands of satisfied customers today.",
      primaryCta: { text: "Start Free Trial", href: "#" },
      variant: "default",
    },
  },
  "faq-item": {
    type: "faq-item",
    name: "FAQ Item",
    description: "Expandable question and answer",
    icon: "HelpCircleIcon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      question: "What is your return policy?",
      answer: "We offer a 30-day money-back guarantee.",
      defaultOpen: false,
    },
  },
  "logo-cloud": {
    type: "logo-cloud",
    name: "Logo Cloud",
    description: "Display of partner or client logos",
    icon: "Building02Icon",
    category: "composite",
    canHaveChildren: false,
    defaultProps: {
      logos: [],
      variant: "inline",
      grayscale: true,
    },
  },
};

// ============================================================================
// Registry Helpers
// ============================================================================

export function getBlockMetadata<T extends BlockType>(
  type: T
): BlockMetadata<T> | undefined {
  return blockRegistry[type] as BlockMetadata<T> | undefined;
}

export function getBlockSchema<T extends BlockType>(
  type: T
): (typeof blockPropsSchemas)[T] | undefined {
  return blockPropsSchemas[type];
}

export function getBlocksByCategory(category: BlockCategory): BlockMetadata[] {
  return Object.values(blockRegistry).filter(
    (block) => block.category === category
  );
}

export function getAllBlocks(): BlockMetadata[] {
  return Object.values(blockRegistry);
}

export function canHaveChildren(type: BlockType): boolean {
  return blockRegistry[type]?.canHaveChildren ?? false;
}

export function isValidChild(
  parentType: BlockType,
  childType: BlockType
): boolean {
  const parent = blockRegistry[parentType];
  if (!parent?.canHaveChildren) return false;
  if (!parent.allowedChildren) return true; // No restrictions
  return parent.allowedChildren.includes(childType);
}

export function getDefaultProps<T extends BlockType>(
  type: T
): Partial<BlockPropsMap[T]> {
  return (blockRegistry[type]?.defaultProps ?? {}) as Partial<BlockPropsMap[T]>;
}

// ============================================================================
// Block Categories for UI
// ============================================================================

export const blockCategories: Array<{
  id: BlockCategory;
  name: string;
  description: string;
}> = [
  {
    id: "layout",
    name: "Layout",
    description: "Structural blocks for page layout",
  },
  {
    id: "content",
    name: "Content",
    description: "Text, images, and media blocks",
  },
  {
    id: "interactive",
    name: "Interactive",
    description: "Buttons, forms, and inputs",
  },
  {
    id: "composite",
    name: "Components",
    description: "Pre-built component combinations",
  },
];
