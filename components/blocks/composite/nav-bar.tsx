"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { BlockRendererProps } from "../index";
import type { NavBarProps } from "@/lib/blocks/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export function NavBarBlock({
  block,
  theme,
  isEditing,
  isSelected,
  onSelect,
}: BlockRendererProps<"nav-bar">) {
  const props = block.props as NavBarProps;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav
      className={cn(
        "w-full px-4 md:px-6 py-4",
        props.sticky && "sticky top-0 z-50",
        props.transparent ? "bg-transparent" : "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        !props.transparent && "border-b",
        block.styleOverrides,
        isEditing && "cursor-pointer",
        isEditing && isSelected && "ring-2 ring-blue-500 ring-offset-2"
      )}
      style={{ fontFamily: theme.fontFamily }}
      onClick={isEditing ? (e) => { e.stopPropagation(); onSelect?.(block.id); } : undefined}
      data-block-id={block.id}
      data-block-type={block.type}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          {props.logo && (
            <img src={props.logo} alt="Logo" className="h-8 w-auto" />
          )}
          {props.logoText && (
            <span
              className="text-xl font-bold"
              style={{ color: theme.textColor }}
            >
              {props.logoText}
            </span>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {props.links.map((link, index) => (
            <Link
              key={index}
              href={isEditing ? "#" : link.href}
              className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
              style={{ color: theme.textColor }}
              onClick={isEditing ? (e) => e.preventDefault() : undefined}
            >
              {link.label}
            </Link>
          ))}
          {props.ctaButton && (
            <Link href={isEditing ? "#" : props.ctaButton.href}>
              <Button
                size="sm"
                style={{ backgroundColor: theme.primaryColor }}
                disabled={isEditing}
              >
                {props.ctaButton.text}
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => !isEditing && setMobileMenuOpen(!mobileMenuOpen)}
        >
          <HugeiconsIcon
            icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon}
            className="w-6 h-6"
            color={theme.textColor}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 border-t pt-4">
          <div className="flex flex-col gap-4">
            {props.links.map((link, index) => (
              <Link
                key={index}
                href={isEditing ? "#" : link.href}
                className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: theme.textColor }}
                onClick={(e) => {
                  if (isEditing) e.preventDefault();
                  else setMobileMenuOpen(false);
                }}
              >
                {link.label}
              </Link>
            ))}
            {props.ctaButton && (
              <Link href={isEditing ? "#" : props.ctaButton.href}>
                <Button
                  size="sm"
                  className="w-full"
                  style={{ backgroundColor: theme.primaryColor }}
                  disabled={isEditing}
                >
                  {props.ctaButton.text}
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
