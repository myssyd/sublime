"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function ProgressBar({ value, max, label, valueLabel }: { value: number; max: number; label: string; valueLabel: string }) {
  const percentage = max === Infinity ? 0 : Math.min(100, (value / max) * 100);
  const isUnlimited = max === Infinity;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{valueLabel}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function UsageDisplay() {
  const usage = useQuery(api.usage.getUsage);

  if (!usage) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-24 rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { usage: stats, limits, plan } = usage;
  const isPro = plan === "pro";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage & Plan</CardTitle>
            <CardDescription>Your current usage and plan limits</CardDescription>
          </div>
          <Badge variant={isPro ? "default" : "secondary"}>
            {isPro ? "Pro" : "Free"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProgressBar
          value={stats.aiCallsThisMonth}
          max={limits.aiCallsPerMonth}
          label="AI Calls"
          valueLabel={`${stats.aiCallsThisMonth} / ${limits.aiCallsPerMonth} this month`}
        />

        <ProgressBar
          value={stats.pagesCreated}
          max={limits.maxPages}
          label="Pages Created"
          valueLabel={
            limits.maxPages === Infinity
              ? `${stats.pagesCreated} (unlimited)`
              : `${stats.pagesCreated} / ${limits.maxPages}`
          }
        />

        <ProgressBar
          value={stats.storageUsedBytes}
          max={limits.maxStorageBytes}
          label="Storage Used"
          valueLabel={`${formatBytes(stats.storageUsedBytes)} / ${formatBytes(limits.maxStorageBytes)}`}
        />

        {!isPro && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              Upgrade to Pro for unlimited pages, 2000 AI calls/month, and 5GB storage.
            </p>
            <Button>Upgrade to Pro</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
