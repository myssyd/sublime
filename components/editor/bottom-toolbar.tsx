"use client";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cursor01Icon,
  CommentAdd02Icon,
  ComputerIcon,
  Tablet01Icon,
  SmartPhone01Icon,
  BubbleChatIcon,
  SidebarRight01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

export type ViewportMode = "desktop" | "tablet" | "mobile";
export type ToolType = "cursor" | "comment";

interface BottomToolbarProps {
  pageName: string;
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  selectedTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isChatOpen: boolean;
  onChatToggle: () => void;
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
}

export function BottomToolbar({
  pageName,
  viewportMode,
  onViewportChange,
  selectedTool,
  onToolChange,
  isChatOpen,
  onChatToggle,
  isSidebarOpen,
  onSidebarToggle,
}: BottomToolbarProps) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 rounded-full bg-background px-2 py-1.5 shadow-lg ring-1 ring-border">
        {/* Back button */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="rounded-full"
          asChild
        >
          <Link href="/dashboard" title="Back to Dashboard">
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
          </Link>
        </Button>

        {/* Page name */}
        <span className="px-2 text-sm font-medium truncate max-w-32">
          {pageName}
        </span>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Viewport switcher */}
        <Button
          variant={viewportMode === "desktop" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={() => onViewportChange("desktop")}
          title="Desktop view"
        >
          <HugeiconsIcon icon={ComputerIcon} className="w-4 h-4" />
        </Button>
        <Button
          variant={viewportMode === "tablet" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={() => onViewportChange("tablet")}
          title="Tablet view"
        >
          <HugeiconsIcon icon={Tablet01Icon} className="w-4 h-4" />
        </Button>
        <Button
          variant={viewportMode === "mobile" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={() => onViewportChange("mobile")}
          title="Mobile view"
        >
          <HugeiconsIcon icon={SmartPhone01Icon} className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Tools */}
        <Button
          variant={selectedTool === "cursor" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={() => onToolChange("cursor")}
          title="Select (V)"
        >
          <HugeiconsIcon icon={Cursor01Icon} className="w-4 h-4" />
        </Button>
        <Button
          variant={selectedTool === "comment" ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={() => onToolChange("comment")}
          title="Comment (C)"
        >
          <HugeiconsIcon icon={CommentAdd02Icon} className="w-4 h-4" />
        </Button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Chat toggle */}
        <Button
          variant={isChatOpen ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={onChatToggle}
          title="AI Chat (/)"
        >
          <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" />
        </Button>

        {/* Sidebar toggle */}
        <Button
          variant={isSidebarOpen ? "secondary" : "ghost"}
          size="icon-sm"
          className="rounded-full"
          onClick={onSidebarToggle}
          title="Sidebar (S)"
        >
          <HugeiconsIcon icon={SidebarRight01Icon} className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
