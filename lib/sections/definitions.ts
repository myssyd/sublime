import { z } from "zod";

// Individual section content schemas
export const sectionSchemas = {
  hero: z.object({
    headline: z.string().describe("Main headline, 3-8 words"),
    subheadline: z.string().describe("Supporting text, 1-2 sentences"),
    cta: z.object({
      text: z.string().describe("Button text, 2-4 words"),
      url: z.string().default("#"),
    }),
    secondaryCta: z
      .object({
        text: z.string(),
        url: z.string(),
      })
      .optional(),
    backgroundImage: z.string().optional(),
    layout: z
      .enum(["centered", "split-left", "split-right"])
      .default("centered"),
  }),

  features: z.object({
    headline: z.string().optional(),
    subheadline: z.string().optional(),
    features: z
      .array(
        z.object({
          icon: z.string().describe("Icon name, e.g., 'Rocket01Icon'"),
          title: z.string(),
          description: z.string(),
        })
      )
      .min(3)
      .max(6),
    layout: z.enum(["grid", "alternating", "cards"]).default("grid"),
  }),

  pricing: z.object({
    headline: z.string().default("Simple, transparent pricing"),
    subheadline: z.string().optional(),
    tiers: z
      .array(
        z.object({
          name: z.string(),
          price: z.string().describe("e.g., '$29/mo' or 'Custom'"),
          description: z.string(),
          features: z.array(z.string()),
          cta: z.object({ text: z.string(), url: z.string() }),
          highlighted: z.boolean().default(false),
        })
      )
      .min(1)
      .max(4),
  }),

  testimonials: z.object({
    headline: z.string().optional(),
    testimonials: z
      .array(
        z.object({
          quote: z.string(),
          author: z.string(),
          role: z.string().optional(),
          company: z.string().optional(),
          avatar: z.string().optional(),
        })
      )
      .min(1)
      .max(6),
    layout: z.enum(["carousel", "grid", "featured"]).default("grid"),
  }),

  faq: z.object({
    headline: z.string().default("Frequently Asked Questions"),
    items: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
        })
      )
      .min(3)
      .max(10),
  }),

  cta: z.object({
    headline: z.string(),
    subheadline: z.string().optional(),
    cta: z.object({ text: z.string(), url: z.string() }),
    style: z.enum(["simple", "gradient", "image-bg"]).default("simple"),
  }),

  // Industry-specific sections
  menu: z.object({
    headline: z.string().default("Our Menu"),
    categories: z.array(
      z.object({
        name: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            description: z.string().optional(),
            price: z.string(),
            image: z.string().optional(),
            tags: z.array(z.string()).optional(), // "vegetarian", "spicy", etc.
          })
        ),
      })
    ),
  }),

  portfolio: z.object({
    headline: z.string().default("Our Work"),
    projects: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          image: z.string(),
          category: z.string().optional(),
          link: z.string().optional(),
        })
      )
      .min(3)
      .max(12),
    layout: z.enum(["grid", "masonry", "carousel"]).default("grid"),
  }),

  team: z.object({
    headline: z.string().default("Meet Our Team"),
    members: z
      .array(
        z.object({
          name: z.string(),
          role: z.string(),
          bio: z.string().optional(),
          image: z.string().optional(),
          social: z
            .object({
              twitter: z.string().optional(),
              linkedin: z.string().optional(),
            })
            .optional(),
        })
      )
      .min(2)
      .max(12),
  }),

  gallery: z.object({
    headline: z.string().optional(),
    images: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          caption: z.string().optional(),
        })
      )
      .min(4)
      .max(20),
    layout: z.enum(["grid", "masonry", "carousel"]).default("grid"),
  }),

  contact: z.object({
    headline: z.string().default("Get in Touch"),
    subheadline: z.string().optional(),
    showForm: z.boolean().default(true),
    formFields: z
      .array(z.enum(["name", "email", "phone", "company", "message"]))
      .default(["name", "email", "message"]),
    contactInfo: z
      .object({
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      })
      .optional(),
    showMap: z.boolean().default(false),
  }),

  // Stats/social proof
  stats: z.object({
    headline: z.string().optional(),
    stats: z
      .array(
        z.object({
          value: z.string().describe("e.g., '10K+', '99%', '$2M'"),
          label: z.string(),
        })
      )
      .min(2)
      .max(6),
  }),

  // Logos/clients
  logos: z.object({
    headline: z.string().default("Trusted by"),
    logos: z
      .array(
        z.object({
          src: z.string(),
          alt: z.string(),
          url: z.string().optional(),
        })
      )
      .min(3)
      .max(12),
  }),

  // About section
  about: z.object({
    headline: z.string().default("About Us"),
    content: z.string().describe("Main about text, 2-4 paragraphs"),
    image: z.string().optional(),
    layout: z.enum(["text-left", "text-right", "centered"]).default("text-left"),
  }),

  // Services section
  services: z.object({
    headline: z.string().default("Our Services"),
    subheadline: z.string().optional(),
    services: z
      .array(
        z.object({
          icon: z.string().optional(),
          title: z.string(),
          description: z.string(),
          price: z.string().optional(),
          link: z.string().optional(),
        })
      )
      .min(3)
      .max(8),
    layout: z.enum(["grid", "list", "cards"]).default("grid"),
  }),
} as const;

export type SectionType = keyof typeof sectionSchemas;
export type SectionContent<T extends SectionType> = z.infer<
  (typeof sectionSchemas)[T]
>;

// Union type for all possible section contents
export type AnySectionContent = {
  [K in SectionType]: SectionContent<K>;
}[SectionType];

// Full section with metadata
export const sectionSchema = z.object({
  type: z.string(),
  content: z.any(),
  variants: z.array(z.any()).optional(),
});

export type Section = z.infer<typeof sectionSchema>;

// Theme schema
export const themeSchema = z.object({
  primaryColor: z.string(),
  secondaryColor: z.string(),
  accentColor: z.string(),
  backgroundColor: z.string(),
  textColor: z.string(),
  fontFamily: z.string(),
});

export type Theme = z.infer<typeof themeSchema>;

// Business context schema
export const businessContextSchema = z.object({
  name: z.string(),
  description: z.string(),
  industry: z.string().optional(),
  targetAudience: z.string().optional(),
  uniqueValue: z.string().optional(),
});

export type BusinessContext = z.infer<typeof businessContextSchema>;

// Helper to validate section content
export function validateSectionContent<T extends SectionType>(
  type: T,
  content: unknown
): SectionContent<T> {
  const schema = sectionSchemas[type];
  return schema.parse(content) as SectionContent<T>;
}

// Helper to check if a section type is valid
export function isValidSectionType(type: string): type is SectionType {
  return type in sectionSchemas;
}

// Get all section types
export function getSectionTypes(): SectionType[] {
  return Object.keys(sectionSchemas) as SectionType[];
}
