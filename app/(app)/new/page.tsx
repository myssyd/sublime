"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModelSelector, DEFAULT_MODEL } from "@/components/model-selector";
import { Loading03Icon, ImageUploadIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type Status = "idle" | "uploading" | "generating" | "redirecting";

interface UploadedImage {
  file: File;
  preview: string;
  url?: string;
}

export default function NewPagePage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const generateLandingPage = useAction(api.agents.actions.generateLandingPageDirect);
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMedia = useMutation(api.media.create);

  const isValid = businessName.trim().length >= 2 && businessDescription.trim().length >= 20;
  const isLoading = status !== "idle";

  const addImages = useCallback((files: File[]) => {
    const newImages = files.slice(0, 10 - images.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages].slice(0, 10));
  }, [images.length]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
    );
    addImages(files);
  }, [addImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter(
        (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
      );
      addImages(files);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const image of images) {
      try {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": image.file.type },
          body: image.file,
        });
        const { storageId } = await result.json();

        const { url } = await createMedia({
          storageId,
          filename: image.file.name,
          mimeType: image.file.type,
          tags: ["generation-upload"],
        });

        if (url) {
          urls.push(url);
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
      }
    }
    return urls;
  };

  const handleGenerate = async () => {
    if (!isValid || isLoading) return;

    setError(null);

    try {
      // Upload images if any
      let imageUrls: string[] = [];
      if (images.length > 0) {
        setStatus("uploading");
        imageUrls = await uploadImages();
      }

      // Generate the page
      setStatus("generating");
      const result = await generateLandingPage({
        businessName: businessName.trim(),
        businessDescription: businessDescription.trim(),
        imageUrls,
        model,
      });

      // Redirect to editor
      setStatus("redirecting");
      router.push(`/editor/${result.pageId}`);
    } catch (err) {
      console.error("Generation failed:", err);
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setStatus("idle");
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case "uploading":
        return "Uploading images...";
      case "generating":
        return "Creating your landing page...";
      case "redirecting":
        return "Success! Opening editor...";
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-2xl flex-col px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Landing Page</h1>
        <p className="text-muted-foreground">
          Tell us about your business and we&apos;ll generate a beautiful landing page
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Paste any information about your business - we&apos;ll make sense of it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Business Name */}
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm font-medium">
              Business Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Acme Coffee Shop"
              disabled={isLoading}
            />
          </div>

          {/* Business Description */}
          <div className="space-y-2">
            <label htmlFor="businessDescription" className="text-sm font-medium">
              Business Description <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Paste info from Google Maps, your website, or just describe what you do
            </p>
            <Textarea
              id="businessDescription"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="e.g., A cozy neighborhood coffee shop in downtown Austin serving specialty espresso drinks, fresh pastries, and light breakfast items. Open 7am-6pm daily. Known for our friendly baristas and relaxing atmosphere. Free WiFi available. ⭐ 4.8 rating with 500+ reviews..."
              className="min-h-[120px] max-h-[300px] overflow-y-auto"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {businessDescription.length < 20
                ? `${20 - businessDescription.length} more characters needed`
                : "✓ Description looks good"}
            </p>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Images <span className="text-muted-foreground">(optional)</span>
            </label>
            <p className="text-xs text-muted-foreground">
              Upload photos of your business, logo, or products to include in the page
            </p>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img.preview}
                      alt={`Upload ${index + 1}`}
                      className="h-20 w-20 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                      className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Drop Zone */}
            {images.length < 10 && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById("fileInput")?.click()}
              >
                <input
                  id="fileInput"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isLoading}
                />
                <HugeiconsIcon
                  icon={ImageUploadIcon}
                  className="w-8 h-8 mx-auto mb-2 text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground">
                  Drop images here or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Max 10 images, 5MB each
                </p>
              </div>
            )}
          </div>

          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <ModelSelector
              value={model}
              onValueChange={setModel}
              disabled={isLoading}
              triggerClassName="w-full"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!isValid || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <HugeiconsIcon icon={Loading03Icon} className="w-4 h-4 animate-spin mr-2" />
                {getStatusMessage()}
              </>
            ) : (
              "Generate Landing Page"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
