"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon, Loading01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";

interface CommentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, model: string) => Promise<void>;
  targetElement: HTMLElement | null;
  elementInfo: string;
  clickPosition?: { x: number; y: number };
}

const AI_MODELS = [
  { value: "claude", label: "Claude" },
  { value: "gpt-4", label: "GPT-4" },
  { value: "gpt-4o", label: "GPT-4o" },
];

export function CommentPopover({
  isOpen,
  onClose,
  onSubmit,
  targetElement,
  elementInfo,
  clickPosition,
}: CommentPopoverProps) {
  const [comment, setComment] = useState("");
  const [model, setModel] = useState("claude");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position based on click position (preferred) or element bounds
  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const popoverHeight = 200; // Approximate height
      const popoverWidth = 384; // w-96 = 24rem = 384px
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top: number;
      let left: number;

      if (clickPosition) {
        // Position based on click location - more reliable for large elements
        top = clickPosition.y + 12;
        left = clickPosition.x - popoverWidth / 2;
      } else if (targetElement) {
        // Fallback to element bounds
        const rect = targetElement.getBoundingClientRect();
        top = rect.bottom + window.scrollY + 12;
        left = rect.left + window.scrollX + (rect.width / 2) - (popoverWidth / 2);
      } else {
        // Center on screen as last resort
        top = viewportHeight / 2 - popoverHeight / 2;
        left = viewportWidth / 2 - popoverWidth / 2;
      }

      // Keep within viewport bounds horizontally
      if (left < 16) left = 16;
      if (left + popoverWidth > viewportWidth - 16) {
        left = viewportWidth - popoverWidth - 16;
      }

      // Keep within viewport bounds vertically
      // If popover would go below viewport, position above click point
      if (top + popoverHeight > viewportHeight - 16) {
        top = (clickPosition?.y || top) - popoverHeight - 12;
      }

      // Make sure it doesn't go above viewport
      if (top < 16) top = 16;

      setPosition({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, targetElement, clickPosition]);

  // Reset comment when popover closes
  useEffect(() => {
    if (!isOpen) {
      setComment("");
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        // Don't close if clicking on the target element or selecting from dropdown
        if (targetElement?.contains(e.target as Node)) return;
        if ((e.target as HTMLElement).closest('[data-radix-select-viewport]')) return;
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, targetElement, onClose]);

  const handleSubmit = async () => {
    if (!comment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(comment, model);
      setComment("");
      onClose();
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen || typeof window === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[100] w-96 rounded-lg bg-popover p-3 shadow-lg ring-1 ring-foreground/10 animate-in fade-in-0 zoom-in-95"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Header with element info and close button */}
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs font-mono truncate max-w-[280px]">
          {elementInfo}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-6 w-6 rounded-full"
          onClick={onClose}
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-3 h-3" />
        </Button>
      </div>

      {/* Comment input */}
      <div className="relative">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the change you want..."
          className="w-full min-h-[60px] max-h-[120px] resize-none rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
          disabled={isSubmitting}
        />
      </div>

      {/* Footer with model selector and submit */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <Select value={model} onValueChange={setModel} disabled={isSubmitting}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[150]">
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          size="icon"
          className="rounded-full h-9 w-9"
          onClick={handleSubmit}
          disabled={!comment.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
          ) : (
            <HugeiconsIcon icon={ArrowUp01Icon} className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>,
    document.body
  );
}
