"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { SectionContent, Theme } from "@/lib/sections/definitions";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

interface FAQSectionProps {
  content: SectionContent<"faq">;
  theme: Theme;
  className?: string;
}

export function FAQSection({ content, theme, className }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      className={cn("px-6 py-20 md:px-12 lg:px-20", className)}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold"
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
        </div>

        <div className="space-y-4">
          {(content.items || []).map((item, index) => (
            <div
              key={index}
              className="border rounded-xl overflow-hidden"
              style={{ borderColor: `${theme.textColor}15` }}
            >
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-black/5 transition-colors"
                onClick={() =>
                  setOpenIndex(openIndex === index ? null : index)
                }
              >
                <span
                  className="font-medium pr-4"
                  style={{ fontFamily: theme.fontFamily }}
                >
                  {item.question}
                </span>
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-transform",
                    openIndex === index && "rotate-180"
                  )}
                  style={{ color: theme.primaryColor }}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-200",
                  openIndex === index
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-6 pb-4 pt-0 text-sm opacity-80 leading-relaxed">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
