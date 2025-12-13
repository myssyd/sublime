"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Image03Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";

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
        <Empty className="border py-12">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Image03Icon} />
            </EmptyMedia>
            <EmptyTitle>No media yet</EmptyTitle>
            <EmptyDescription>
              Upload images to use in your landing pages
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button>Upload Your First Image</Button>
          </EmptyContent>
        </Empty>
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
