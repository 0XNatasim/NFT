"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
];

const VIDEO_EXTENSIONS = new Set(["mp4", "webm"]);
const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);

type MediaKind = "image" | "video" | "unknown";

interface NFTMediaProps {
  imageUrl?: string | null;
  animationUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

function metadataString(metadata: Record<string, unknown> | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function ipfsPath(uri: string): string | null {
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "").replace(/^ipfs\//, "");
  }

  try {
    const url = new URL(uri);
    const marker = "/ipfs/";
    const index = url.pathname.indexOf(marker);
    if (index >= 0) return url.pathname.slice(index + marker.length) + url.search;
  } catch {
    return null;
  }

  return null;
}

function normalizeMediaUrls(uri: string | null): string[] {
  if (!uri) return [];
  const path = ipfsPath(uri);
  if (!path) return [uri];
  return IPFS_GATEWAYS.map((gateway) => `${gateway}${path}`);
}

function extensionFromUrl(uri: string): string | null {
  const withoutQuery = uri.split(/[?#]/)[0] ?? uri;
  const extension = withoutQuery.split(".").pop()?.toLowerCase();
  return extension || null;
}

function kindFromExtension(uri: string): MediaKind {
  const extension = extensionFromUrl(uri);
  if (extension && VIDEO_EXTENSIONS.has(extension)) return "video";
  if (extension && IMAGE_EXTENSIONS.has(extension)) return "image";
  return "unknown";
}

function kindFromContentType(contentType: string | null): MediaKind {
  if (!contentType) return "unknown";
  if (contentType.startsWith("video/mp4") || contentType.startsWith("video/webm")) {
    return "video";
  }
  if (contentType.startsWith("image/")) return "image";
  return "unknown";
}

export function NFTMedia({
  imageUrl,
  animationUrl,
  metadata,
  alt,
  className,
  fallbackClassName,
}: NFTMediaProps) {
  const preferredUrl =
    animationUrl ??
    metadataString(metadata, "animation_url") ??
    metadataString(metadata, "animationUrl") ??
    imageUrl ??
    metadataString(metadata, "image") ??
    metadataString(metadata, "image_url") ??
    metadataString(metadata, "imageUrl");

  const urls = useMemo(() => normalizeMediaUrls(preferredUrl), [preferredUrl]);
  const [index, setIndex] = useState(0);
  const [contentTypeKind, setContentTypeKind] = useState<MediaKind>("unknown");

  useEffect(() => {
    setIndex(0);
  }, [preferredUrl]);

  const src = urls[index] ?? null;

  useEffect(() => {
    setContentTypeKind("unknown");
    if (!src || kindFromExtension(src) !== "unknown") return;

    const controller = new AbortController();
    fetch(src, { method: "HEAD", signal: controller.signal })
      .then((res) => {
        if (res.ok) setContentTypeKind(kindFromContentType(res.headers.get("content-type")));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [src]);

  const retry = () => setIndex((current) => current + 1);

  if (!src || index >= urls.length) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName
        )}
        aria-label={`${alt} media unavailable`}
      >
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  const kind = kindFromExtension(src) === "unknown" ? contentTypeKind : kindFromExtension(src);

  if (kind === "video") {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className={className}
        onError={retry}
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={retry}
    />
  );
}
