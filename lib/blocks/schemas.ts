import { z } from "zod";

// ============================================================================
// Layout Block Schemas
// ============================================================================

export const sectionPropsSchema = z.object({
  as: z
    .enum(["section", "article", "aside", "main", "header", "footer"])
    .default("section"),
  maxWidth: z
    .enum(["sm", "md", "lg", "xl", "2xl", "full", "none"])
    .default("xl"),
  padding: z.enum(["none", "sm", "md", "lg", "xl"]).default("lg"),
  background: z
    .enum(["none", "primary", "secondary", "accent", "muted", "custom"])
    .default("none"),
  customBackground: z.string().optional(),
});

export const containerPropsSchema = z.object({
  as: z.enum(["div", "section", "article"]).default("div"),
  maxWidth: z.enum(["sm", "md", "lg", "xl", "2xl", "full"]).default("xl"),
  padding: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
  centered: z.boolean().default(true),
});

export const gridPropsSchema = z.object({
  columns: z
    .union([
      z.number().min(1).max(12),
      z.object({
        sm: z.number().min(1).max(12).optional(),
        md: z.number().min(1).max(12).optional(),
        lg: z.number().min(1).max(12).optional(),
        xl: z.number().min(1).max(12).optional(),
      }),
    ])
    .default(3),
  gap: z.enum(["none", "xs", "sm", "md", "lg", "xl"]).default("md"),
  alignItems: z.enum(["start", "center", "end", "stretch"]).default("stretch"),
});

export const flexPropsSchema = z.object({
  direction: z
    .enum(["row", "col", "row-reverse", "col-reverse"])
    .default("row"),
  gap: z.enum(["none", "xs", "sm", "md", "lg", "xl"]).default("md"),
  justify: z
    .enum(["start", "center", "end", "between", "around", "evenly"])
    .default("start"),
  align: z
    .enum(["start", "center", "end", "stretch", "baseline"])
    .default("center"),
  wrap: z.boolean().default(false),
});

export const columnsPropsSchema = z.object({
  layout: z
    .enum(["1-1", "1-2", "2-1", "1-1-1", "1-2-1", "2-1-1", "1-1-2"])
    .default("1-1"),
  gap: z.enum(["none", "sm", "md", "lg", "xl"]).default("md"),
  verticalAlign: z.enum(["top", "center", "bottom"]).default("top"),
  stackOn: z.enum(["sm", "md", "lg", "never"]).default("md"),
});

// ============================================================================
// Content Block Schemas
// ============================================================================

export const headingPropsSchema = z.object({
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  text: z.string().min(1),
  align: z.enum(["left", "center", "right"]).default("left"),
});

export const textPropsSchema = z.object({
  text: z.string(),
  as: z.enum(["p", "span", "div"]).default("p"),
  size: z.enum(["xs", "sm", "base", "lg", "xl", "2xl"]).default("base"),
  align: z.enum(["left", "center", "right"]).default("left"),
  muted: z.boolean().default(false),
});

export const imagePropsSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  objectFit: z.enum(["cover", "contain", "fill", "none"]).default("cover"),
  rounded: z.enum(["none", "sm", "md", "lg", "xl", "full"]).default("md"),
  aspectRatio: z
    .enum(["auto", "square", "video", "portrait", "wide"])
    .default("auto"),
});

export const iconPropsSchema = z.object({
  name: z.string(),
  size: z.enum(["xs", "sm", "md", "lg", "xl"]).default("md"),
  color: z
    .enum(["inherit", "primary", "secondary", "accent", "muted"])
    .default("inherit"),
});

export const linkPropsSchema = z.object({
  text: z.string().min(1),
  href: z.string(),
  isExternal: z.boolean().default(false),
  variant: z.enum(["default", "underline", "muted"]).default("default"),
});

export const dividerPropsSchema = z.object({
  orientation: z.enum(["horizontal", "vertical"]).default("horizontal"),
  variant: z.enum(["solid", "dashed", "dotted"]).default("solid"),
  spacing: z.enum(["sm", "md", "lg"]).default("md"),
});

export const spacerPropsSchema = z.object({
  size: z.enum(["xs", "sm", "md", "lg", "xl", "2xl"]).default("md"),
});

// ============================================================================
// Interactive Block Schemas
// ============================================================================

export const buttonPropsSchema = z.object({
  text: z.string().min(1),
  href: z.string().optional(),
  variant: z
    .enum(["default", "secondary", "outline", "ghost", "destructive", "link"])
    .default("default"),
  size: z.enum(["sm", "default", "lg", "icon"]).default("default"),
  iconStart: z.string().optional(),
  iconEnd: z.string().optional(),
  fullWidth: z.boolean().default(false),
});

export const buttonGroupPropsSchema = z.object({
  align: z.enum(["start", "center", "end"]).default("start"),
  direction: z.enum(["row", "col"]).default("row"),
  gap: z.enum(["sm", "md", "lg"]).default("md"),
});

export const inputPropsSchema = z.object({
  name: z.string().min(1),
  type: z
    .enum(["text", "email", "password", "tel", "number", "url"])
    .default("text"),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  helperText: z.string().optional(),
});

export const textareaPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  rows: z.number().min(1).max(20).default(4),
  helperText: z.string().optional(),
});

export const selectPropsSchema = z.object({
  name: z.string().min(1),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  options: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .min(1),
});

export const formPropsSchema = z.object({
  action: z.string().optional(),
  method: z.enum(["GET", "POST"]).default("POST"),
  submitText: z.string().default("Submit"),
  successMessage: z.string().optional(),
});

// ============================================================================
// Composite Block Schemas
// ============================================================================

export const cardPropsSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  href: z.string().optional(),
  variant: z.enum(["default", "elevated", "outlined"]).default("default"),
});

export const featureCardPropsSchema = z.object({
  icon: z.string(),
  title: z.string().min(1),
  description: z.string(),
  href: z.string().optional(),
});

export const pricingCardPropsSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  period: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).min(1),
  ctaText: z.string().default("Get Started"),
  ctaHref: z.string().default("#"),
  highlighted: z.boolean().default(false),
  badge: z.string().optional(),
});

export const testimonialCardPropsSchema = z.object({
  quote: z.string().min(1),
  author: z.string().min(1),
  role: z.string().optional(),
  company: z.string().optional(),
  avatar: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
});

export const statCardPropsSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  trend: z
    .object({
      value: z.string(),
      direction: z.enum(["up", "down", "neutral"]),
    })
    .optional(),
});

export const teamMemberCardPropsSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
});

export const navBarPropsSchema = z.object({
  logo: z.string().optional(),
  logoText: z.string().optional(),
  links: z.array(
    z.object({
      label: z.string(),
      href: z.string(),
    })
  ),
  ctaButton: z
    .object({
      text: z.string(),
      href: z.string(),
    })
    .optional(),
  sticky: z.boolean().default(true),
  transparent: z.boolean().default(false),
});

export const footerBlockPropsSchema = z.object({
  logo: z.string().optional(),
  logoText: z.string().optional(),
  description: z.string().optional(),
  columns: z
    .array(
      z.object({
        title: z.string(),
        links: z.array(
          z.object({
            label: z.string(),
            href: z.string(),
          })
        ),
      })
    )
    .optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string(),
        url: z.string().url(),
      })
    )
    .optional(),
  copyright: z.string().optional(),
});

export const heroBlockPropsSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  primaryCta: z
    .object({
      text: z.string(),
      href: z.string(),
    })
    .optional(),
  secondaryCta: z
    .object({
      text: z.string(),
      href: z.string(),
    })
    .optional(),
  image: z.string().optional(),
  imagePosition: z
    .enum(["right", "left", "background", "none"])
    .default("none"),
  alignment: z.enum(["left", "center"]).default("center"),
  minHeight: z.enum(["auto", "screen", "half"]).default("half"),
});

export const ctaBlockPropsSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().optional(),
  primaryCta: z.object({
    text: z.string(),
    href: z.string(),
  }),
  secondaryCta: z
    .object({
      text: z.string(),
      href: z.string(),
    })
    .optional(),
  variant: z.enum(["default", "gradient", "image"]).default("default"),
  backgroundImage: z.string().optional(),
});

export const faqItemPropsSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  defaultOpen: z.boolean().default(false),
});

export const logoCloudPropsSchema = z.object({
  title: z.string().optional(),
  logos: z
    .array(
      z.object({
        src: z.string(),
        alt: z.string(),
        href: z.string().optional(),
      })
    )
    .min(1),
  variant: z.enum(["grid", "scroll", "inline"]).default("inline"),
  grayscale: z.boolean().default(true),
});

// ============================================================================
// Block Definition Schema
// ============================================================================

export const blockDefinitionSchema = z.object({
  id: z.string().min(1),
  type: z.string(),
  props: z.record(z.string(), z.any()),
  children: z.array(z.string()).optional(),
  styleOverrides: z.string().optional(),
  responsiveStyles: z
    .object({
      sm: z.string().optional(),
      md: z.string().optional(),
      lg: z.string().optional(),
      xl: z.string().optional(),
    })
    .optional(),
});

export const blockCompositionSchema = z.object({
  root: z.string().min(1),
  blocks: z.record(z.string(), blockDefinitionSchema),
});

// ============================================================================
// Schema Map
// ============================================================================

export const blockPropsSchemas = {
  // Layout
  section: sectionPropsSchema,
  container: containerPropsSchema,
  grid: gridPropsSchema,
  flex: flexPropsSchema,
  columns: columnsPropsSchema,
  // Content
  heading: headingPropsSchema,
  text: textPropsSchema,
  image: imagePropsSchema,
  icon: iconPropsSchema,
  link: linkPropsSchema,
  divider: dividerPropsSchema,
  spacer: spacerPropsSchema,
  // Interactive
  button: buttonPropsSchema,
  "button-group": buttonGroupPropsSchema,
  input: inputPropsSchema,
  textarea: textareaPropsSchema,
  select: selectPropsSchema,
  form: formPropsSchema,
  // Composite
  card: cardPropsSchema,
  "feature-card": featureCardPropsSchema,
  "pricing-card": pricingCardPropsSchema,
  "testimonial-card": testimonialCardPropsSchema,
  "stat-card": statCardPropsSchema,
  "team-member-card": teamMemberCardPropsSchema,
  "nav-bar": navBarPropsSchema,
  "footer-block": footerBlockPropsSchema,
  "hero-block": heroBlockPropsSchema,
  "cta-block": ctaBlockPropsSchema,
  "faq-item": faqItemPropsSchema,
  "logo-cloud": logoCloudPropsSchema,
} as const;

export type BlockPropsSchemas = typeof blockPropsSchemas;
