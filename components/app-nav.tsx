"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/components/theme-provider";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon, Settings02Icon, ComputerIcon } from "@hugeicons/core-free-icons";

interface AppNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  usage?: {
    usage: {
      aiCallsThisMonth: number;
    };
    limits: {
      aiCallsPerMonth: number;
    };
  } | null;
}

export function AppNav({ user, usage }: AppNavProps) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="border-b border-border/40">
      <div className="container mx-auto flex h-11 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-base font-semibold">
            Sublime
          </Link>
          <nav className="hidden items-center gap-3 sm:flex">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/media"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Media
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8 rounded-full">
                <Avatar className="size-7">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
                  <AvatarFallback className="text-xs">
                    {user.name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name || "User"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              {usage && (
                <>
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>AI calls</span>
                      <span>
                        {usage.usage.aiCallsThisMonth}/{usage.limits.aiCallsPerMonth}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: `${Math.min(100, (usage.usage.aiCallsThisMonth / usage.limits.aiCallsPerMonth) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={toggleTheme}>
                <HugeiconsIcon
                  icon={theme === "dark" ? Sun03Icon : theme === "light" ? Moon02Icon : ComputerIcon}
                  className="size-4"
                />
                {theme === "light" ? "Dark mode" : theme === "dark" ? "System" : "Light mode"}
                <span className="ml-auto text-xs text-muted-foreground">D</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <HugeiconsIcon icon={Settings02Icon} className="size-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
