"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Placeholder for Sprint 5 - Media Library
export default function MediaPage() {
  const { data: session } = useSession();
  const media = useQuery(api.media.list, session ? {} : "skip");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground">
            Upload and manage images for your landing pages
          </p>
        </div>
        <Button>Upload Image</Button>
      </div>

      {/* Upload zone placeholder */}
      <Card className="mb-8">
        <CardContent className="flex h-32 items-center justify-center border-2 border-dashed border-muted-foreground/20">
          <div className="text-center text-muted-foreground">
            <p>Drag and drop images here, or click to browse</p>
            <p className="text-xs">(Coming in Sprint 5)</p>
          </div>
        </CardContent>
      </Card>

      {/* Media grid */}
      {media === undefined ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : media.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-medium">No media yet</h3>
            <p className="mb-4 text-muted-foreground">
              Upload images to use in your landing pages
            </p>
            <Button>Upload Your First Image</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {media.map((item: any) => (
            <Card key={item._id} className="overflow-hidden">
              <div className="aspect-square bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.filename}
                  className="h-full w-full object-cover"
                />
              </div>
              <CardContent className="p-2">
                <p className="truncate text-xs">{item.filename}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {item.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="rounded bg-muted px-1.5 py-0.5 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
