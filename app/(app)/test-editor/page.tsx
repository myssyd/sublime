"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

export default function TestEditorPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState<string | null>(null);

  const websites = useQuery(api.websites.list);
  const createWebsite = useMutation(api.websites.create);
  const createPage = useMutation(api.pages.create);

  useEffect(() => {
    if (!session) {
      setStatus("Waiting for session...");
      return;
    }

    if (websites === undefined) {
      setStatus("Loading websites...");
      return;
    }

    const setup = async () => {
      try {
        let websiteId: string;
        let pageId: string;

        // Check if we have an existing test website
        const testWebsite = websites.find(w => w.name === "Test Block Editor");

        if (testWebsite) {
          setStatus("Found existing test website, checking for pages...");
          websiteId = testWebsite._id;

          // Query pages for this website
          const pagesResult = await fetch(`/api/test-pages?websiteId=${websiteId}`);

          // For now, just redirect to create a new page
          setStatus("Creating test page...");
          pageId = await createPage({
            websiteId: websiteId as any,
            name: "Test Page " + Date.now(),
            slug: "test-" + Date.now(),
            pageType: "landing",
            isHomePage: false,
          });
        } else {
          // Create new test website
          setStatus("Creating test website...");
          websiteId = await createWebsite({
            name: "Test Block Editor",
            businessContext: {
              name: "Test Business",
              description: "A test website to try out the new block editor",
            },
            theme: {
              primaryColor: "#6366f1",
              secondaryColor: "#8b5cf6",
              accentColor: "#f59e0b",
              backgroundColor: "#ffffff",
              textColor: "#1f2937",
              fontFamily: "Inter",
            },
          });

          // Create a test page
          setStatus("Creating test page...");
          pageId = await createPage({
            websiteId: websiteId as any,
            name: "Home",
            slug: "home",
            pageType: "landing",
            isHomePage: true,
          });
        }

        setStatus("Redirecting to editor...");
        router.push(`/websites/${websiteId}/${pageId}/editor`);
      } catch (err: any) {
        console.error("Setup error:", err);
        setError(err.message || "Failed to set up test editor");
      }
    };

    setup();
  }, [session, websites, createWebsite, createPage, router]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="w-8 h-8 animate-spin"
        style={{ animationDuration: "0.5s" }}
      />
      <p className="text-muted-foreground">{status}</p>
    </div>
  );
}
