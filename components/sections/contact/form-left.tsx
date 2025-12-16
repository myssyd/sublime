"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Mail01Icon, Call02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TemplateProps } from "../types";
import {
  applyElementOverrides,
  applySectionOverrides,
} from "@/lib/sections/style-overrides";

export function ContactFormLeft({
  content,
  theme,
  styleOverrides,
  className,
}: TemplateProps<"contact">) {
  const hasContactInfo =
    content.contactInfo?.email ||
    content.contactInfo?.phone ||
    content.contactInfo?.address;

  return (
    <section
      className={applySectionOverrides(
        cn("px-6 py-20 md:px-12 lg:px-20", className),
        styleOverrides
      )}
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2
            className={applyElementOverrides(
              "text-3xl md:text-4xl font-bold mb-4",
              "headline",
              styleOverrides
            )}
            style={{ fontFamily: theme.fontFamily }}
          >
            {content.headline}
          </h2>
          {content.subheadline && (
            <p
              className={applyElementOverrides(
                "text-lg opacity-80 max-w-2xl mx-auto",
                "subheadline",
                styleOverrides
              )}
              style={{ fontFamily: theme.fontFamily }}
            >
              {content.subheadline}
            </p>
          )}
        </div>

        <div
          className={cn(
            "grid gap-12",
            hasContactInfo && content.showForm
              ? "md:grid-cols-2"
              : "max-w-xl mx-auto"
          )}
        >
          {content.showForm && (
            <form
              className={applyElementOverrides(
                "space-y-6",
                "form",
                styleOverrides
              )}
              onSubmit={(e) => e.preventDefault()}
            >
              {content.formFields?.includes("name") && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    style={{ borderColor: `${theme.textColor}20` }}
                  />
                </div>
              )}

              {content.formFields?.includes("email") && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    style={{ borderColor: `${theme.textColor}20` }}
                  />
                </div>
              )}

              {content.formFields?.includes("phone") && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Your phone number"
                    style={{ borderColor: `${theme.textColor}20` }}
                  />
                </div>
              )}

              {content.formFields?.includes("company") && (
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Your company"
                    style={{ borderColor: `${theme.textColor}20` }}
                  />
                </div>
              )}

              {content.formFields?.includes("message") && (
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="How can we help?"
                    rows={4}
                    style={{ borderColor: `${theme.textColor}20` }}
                  />
                </div>
              )}

              <Button
                type="submit"
                className={applyElementOverrides(
                  "w-full h-12 font-semibold",
                  "form.submit",
                  styleOverrides
                )}
                style={{
                  backgroundColor: theme.primaryColor,
                  color: theme.backgroundColor,
                }}
              >
                Send Message
              </Button>
            </form>
          )}

          {hasContactInfo && (
            <div
              className={applyElementOverrides(
                "space-y-6",
                "contactInfo",
                styleOverrides
              )}
            >
              {content.contactInfo?.email && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    <HugeiconsIcon
                      icon={Mail01Icon}
                      className="w-6 h-6"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Email</div>
                    <a
                      href={`mailto:${content.contactInfo.email}`}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {content.contactInfo.email}
                    </a>
                  </div>
                </div>
              )}

              {content.contactInfo?.phone && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    <HugeiconsIcon
                      icon={Call02Icon}
                      className="w-6 h-6"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Phone</div>
                    <a
                      href={`tel:${content.contactInfo.phone}`}
                      className="opacity-70 hover:opacity-100 transition-opacity"
                    >
                      {content.contactInfo.phone}
                    </a>
                  </div>
                </div>
              )}

              {content.contactInfo?.address && (
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${theme.primaryColor}15` }}
                  >
                    <HugeiconsIcon
                      icon={Location01Icon}
                      className="w-6 h-6"
                      style={{ color: theme.primaryColor }}
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-1">Address</div>
                    <div className="opacity-70">{content.contactInfo.address}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
