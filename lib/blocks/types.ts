import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// Block Types
// ============================================================================

export type LayoutBlockType =
  | "section"
  | "container"
  | "grid"
  | "flex"
  | "columns";

export type ContentBlockType =
  | "heading"
  | "text"
  | "image"
  | "icon"
  | "link"
  | "divider"
  | "spacer";

export type InteractiveBlockType =
  | "button"
  | "button-group"
  | "input"
  | "textarea"
  | "select"
  | "form";

export type CompositeBlockType =
  | "card"
  | "feature-card"
  | "pricing-card"
  | "testimonial-card"
  | "stat-card"
  | "team-member-card"
  | "nav-bar"
  | "footer-block"
  | "hero-block"
  | "cta-block"
  | "faq-item"
  | "logo-cloud";

export type BlockType =
  | LayoutBlockType
  | ContentBlockType
  | InteractiveBlockType
  | CompositeBlockType;

export type BlockCategory = "layout" | "content" | "interactive" | "composite";

// ============================================================================
// Block Definition
// ============================================================================

export interface BlockDefinition<T extends BlockType = BlockType> {
  id: string;
  type: T;
  props: BlockPropsMap[T];
  children?: string[]; // IDs of child blocks (for container blocks)
  styleOverrides?: string; // Tailwind classes
  responsiveStyles?: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
}

export interface BlockComposition {
  root: string;
  blocks: Record<string, BlockDefinition>;
}

// ============================================================================
// Block Props by Type
// ============================================================================

// Layout Props
export interface SectionProps {
  as?: "section" | "article" | "aside" | "main" | "header" | "footer";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  background?: "none" | "primary" | "secondary" | "accent" | "muted" | "custom";
  customBackground?: string;
}

export interface ContainerProps {
  as?: "div" | "section" | "article";
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  centered?: boolean;
}

export interface GridProps {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  alignItems?: "start" | "center" | "end" | "stretch";
}

export interface FlexProps {
  direction?: "row" | "col" | "row-reverse" | "col-reverse";
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  wrap?: boolean;
}

export interface ColumnsProps {
  layout?: "1-1" | "1-2" | "2-1" | "1-1-1" | "1-2-1" | "2-1-1" | "1-1-2";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  verticalAlign?: "top" | "center" | "bottom";
  stackOn?: "sm" | "md" | "lg" | "never";
}

// Content Props
export interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  align?: "left" | "center" | "right";
}

export interface TextProps {
  text: string;
  as?: "p" | "span" | "div";
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  align?: "left" | "center" | "right";
  muted?: boolean;
}

export interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit?: "cover" | "contain" | "fill" | "none";
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "full";
  aspectRatio?: "auto" | "square" | "video" | "portrait" | "wide";
}

export interface IconProps {
  name: string; // Hugeicon name
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: "inherit" | "primary" | "secondary" | "accent" | "muted";
}

export interface LinkProps {
  text: string;
  href: string;
  isExternal?: boolean;
  variant?: "default" | "underline" | "muted";
}

export interface DividerProps {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "dotted";
  spacing?: "sm" | "md" | "lg";
}

export interface SpacerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
}

// Interactive Props
export interface ButtonProps {
  text: string;
  href?: string;
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "sm" | "default" | "lg" | "icon";
  iconStart?: string;
  iconEnd?: string;
  fullWidth?: boolean;
}

export interface ButtonGroupProps {
  align?: "start" | "center" | "end";
  direction?: "row" | "col";
  gap?: "sm" | "md" | "lg";
}

export interface InputProps {
  name: string;
  type?: "text" | "email" | "password" | "tel" | "number" | "url";
  label?: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
}

export interface TextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
  helperText?: string;
}

export interface SelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
}

export interface FormProps {
  action?: string;
  method?: "GET" | "POST";
  submitText?: string;
  successMessage?: string;
}

// Composite Props
export interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  href?: string;
  variant?: "default" | "elevated" | "outlined";
}

export interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  href?: string;
}

export interface PricingCardProps {
  name: string;
  price: string;
  period?: string;
  description?: string;
  features: string[];
  ctaText?: string;
  ctaHref?: string;
  highlighted?: boolean;
  badge?: string;
}

export interface TestimonialCardProps {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
  rating?: number;
}

export interface StatCardProps {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  trend?: { value: string; direction: "up" | "down" | "neutral" };
}

export interface TeamMemberCardProps {
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
}

export interface NavBarProps {
  logo?: string;
  logoText?: string;
  links: Array<{ label: string; href: string }>;
  ctaButton?: { text: string; href: string };
  sticky?: boolean;
  transparent?: boolean;
}

export interface FooterBlockProps {
  logo?: string;
  logoText?: string;
  description?: string;
  columns?: Array<{
    title: string;
    links: Array<{ label: string; href: string }>;
  }>;
  socialLinks?: Array<{ platform: string; url: string }>;
  copyright?: string;
}

export interface HeroBlockProps {
  headline: string;
  subheadline?: string;
  primaryCta?: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  image?: string;
  imagePosition?: "right" | "left" | "background" | "none";
  alignment?: "left" | "center";
  minHeight?: "auto" | "screen" | "half";
}

export interface CtaBlockProps {
  headline: string;
  subheadline?: string;
  primaryCta: { text: string; href: string };
  secondaryCta?: { text: string; href: string };
  variant?: "default" | "gradient" | "image";
  backgroundImage?: string;
}

export interface FaqItemProps {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}

export interface LogoCloudProps {
  title?: string;
  logos: Array<{ src: string; alt: string; href?: string }>;
  variant?: "grid" | "scroll" | "inline";
  grayscale?: boolean;
}

// ============================================================================
// Props Map (maps BlockType to its Props interface)
// ============================================================================

export interface BlockPropsMap {
  // Layout
  section: SectionProps;
  container: ContainerProps;
  grid: GridProps;
  flex: FlexProps;
  columns: ColumnsProps;
  // Content
  heading: HeadingProps;
  text: TextProps;
  image: ImageProps;
  icon: IconProps;
  link: LinkProps;
  divider: DividerProps;
  spacer: SpacerProps;
  // Interactive
  button: ButtonProps;
  "button-group": ButtonGroupProps;
  input: InputProps;
  textarea: TextareaProps;
  select: SelectProps;
  form: FormProps;
  // Composite
  card: CardProps;
  "feature-card": FeatureCardProps;
  "pricing-card": PricingCardProps;
  "testimonial-card": TestimonialCardProps;
  "stat-card": StatCardProps;
  "team-member-card": TeamMemberCardProps;
  "nav-bar": NavBarProps;
  "footer-block": FooterBlockProps;
  "hero-block": HeroBlockProps;
  "cta-block": CtaBlockProps;
  "faq-item": FaqItemProps;
  "logo-cloud": LogoCloudProps;
}

// ============================================================================
// Theme Types
// ============================================================================

export interface Theme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  borderRadius?: "none" | "sm" | "md" | "lg" | "xl" | "full";
}

// ============================================================================
// Website & Page Types
// ============================================================================

export interface BusinessContext {
  name: string;
  description: string;
  industry?: string;
  targetAudience?: string;
  uniqueValue?: string;
}

export interface NavigationLink {
  label: string;
  pageId?: Id<"pages">;
  url?: string;
  isExternal?: boolean;
}

export interface WebsiteNavigation {
  logo?: string;
  logoText?: string;
  links: NavigationLink[];
  ctaButton?: {
    text: string;
    pageId?: Id<"pages">;
    url?: string;
  };
}

export interface WebsiteFooter {
  logo?: string;
  logoText?: string;
  description?: string;
  columns?: Array<{
    title: string;
    links: NavigationLink[];
  }>;
  socialLinks?: Array<{ platform: string; url: string }>;
  copyright?: string;
}

export type PageType =
  | "landing"
  | "about"
  | "contact"
  | "services"
  | "portfolio"
  | "blog-list"
  | "blog-post"
  | "dashboard"
  | "custom";

export interface PageMeta {
  title?: string;
  description?: string;
  ogImage?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type BlockWithChildren = Extract<
  BlockType,
  "section" | "container" | "grid" | "flex" | "columns" | "button-group" | "form"
>;

export function isContainerBlock(type: BlockType): type is BlockWithChildren {
  return [
    "section",
    "container",
    "grid",
    "flex",
    "columns",
    "button-group",
    "form",
  ].includes(type);
}

export function getBlockCategory(type: BlockType): BlockCategory {
  if (["section", "container", "grid", "flex", "columns"].includes(type)) {
    return "layout";
  }
  if (["heading", "text", "image", "icon", "link", "divider", "spacer"].includes(type)) {
    return "content";
  }
  if (["button", "button-group", "input", "textarea", "select", "form"].includes(type)) {
    return "interactive";
  }
  return "composite";
}
