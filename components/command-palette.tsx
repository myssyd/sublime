"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "@/components/theme-provider";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Image02Icon,
  Settings02Icon,
  Add01Icon,
  File02Icon,
  Sun03Icon,
  Moon02Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { Id } from "@/convex/_generated/dataModel";

interface LandingPage {
  _id: Id<"landingPages">;
  name: string;
  status: "generating" | "draft" | "published";
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  // Fetch recent pages
  const pages = useQuery(api.landingPages.list, session ? {} : "skip");

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  // Get the 5 most recent pages
  const recentPages = pages?.slice(0, 5) ?? [];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
              <HugeiconsIcon icon={Home01Icon} className="size-4" />
              Dashboard
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/media"))}>
              <HugeiconsIcon icon={Image02Icon} className="size-4" />
              Media Library
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
              <HugeiconsIcon icon={Settings02Icon} className="size-4" />
              Settings
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/new"))}>
              <HugeiconsIcon icon={Add01Icon} className="size-4" />
              Create New Page
            </CommandItem>
          </CommandGroup>

          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Recent Pages">
                {recentPages.map((page: LandingPage) => (
                  <CommandItem
                    key={page._id}
                    onSelect={() => runCommand(() => router.push(`/editor/${page._id}`))}
                  >
                    <HugeiconsIcon icon={File02Icon} className="size-4" />
                    <span className="truncate">{page.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {page.status}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {/* Actions */}
          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem onSelect={() => runCommand(toggleTheme)}>
              <HugeiconsIcon
                icon={theme === "dark" ? Sun03Icon : theme === "light" ? Moon02Icon : ComputerIcon}
                className="size-4"
              />
              {theme === "light" ? "Switch to Dark Mode" : theme === "dark" ? "Switch to System Theme" : "Switch to Light Mode"}
              <CommandShortcut>D</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
