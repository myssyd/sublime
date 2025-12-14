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

type AnimationPhase = 'idle' | 'content-fading' | 'morphing' | 'loading';

interface CommentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comment: string, model: string) => Promise<void>;
  targetElement: HTMLElement | null;
  elementInfo: string;
  clickPosition?: { x: number; y: number };
  isProcessing?: boolean;
}

const AI_MODELS = [
  { value: "gemini", label: "Gemini" },
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
  isProcessing = false,
}: CommentPopoverProps) {
  const [comment, setComment] = useState("");
  const [model, setModel] = useState("gemini");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');
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
      setAnimationPhase('idle');
    }
  }, [isOpen]);

  // Handle animation phase transitions when processing starts
  useEffect(() => {
    if (isProcessing) {
      // Start the animation sequence: content fade out
      setAnimationPhase('content-fading');

      // After content fades, morph the container
      const morphTimer = setTimeout(() => {
        setAnimationPhase('morphing');
      }, 150);

      // After morph completes, show loading dots
      const loadingTimer = setTimeout(() => {
        setAnimationPhase('loading');
      }, 350); // 150ms fade + 200ms morph

      return () => {
        clearTimeout(morphTimer);
        clearTimeout(loadingTimer);
      };
    } else {
      setAnimationPhase('idle');
    }
  }, [isProcessing]);

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

  // Determine if we're in loading mode (morphing or loading phase)
  const isInLoadingMode = animationPhase === 'morphing' || animationPhase === 'loading';
  const isContentFading = animationPhase === 'content-fading' || isInLoadingMode;
  const showLoadingDots = animationPhase === 'loading';

  return createPortal(
    <div
      ref={popoverRef}
      className={`fixed z-[100] bg-popover shadow-lg ring-1 ring-foreground/10 overflow-hidden ${
        animationPhase === 'idle' ? 'animate-in fade-in-0 zoom-in-95' : ''
      }`}
      style={{
        top: position.top,
        left: position.left,
        width: isInLoadingMode ? '56px' : '384px',
        height: isInLoadingMode ? '32px' : 'auto',
        borderRadius: isInLoadingMode ? '9999px' : '8px',
        padding: isInLoadingMode ? '0' : '12px',
        transition: 'width 200ms ease-out, height 200ms ease-out, border-radius 200ms ease-out, padding 200ms ease-out',
      }}
    >
      {/* Form content - fades out when processing */}
      <div
        className="transition-opacity duration-150"
        style={{
          opacity: isContentFading ? 0 : 1,
          visibility: isInLoadingMode ? 'hidden' : 'visible',
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
      </div>

      {/* Loading dots - fades in when in loading mode */}
      {isInLoadingMode && (
        <div
          className="absolute inset-0 flex items-center justify-center transition-opacity duration-150"
          style={{
            opacity: showLoadingDots ? 1 : 0,
          }}
        >
          <div className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "0ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "150ms", animationDuration: "600ms" }}
            />
            <span
              className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
              style={{ animationDelay: "300ms", animationDuration: "600ms" }}
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
