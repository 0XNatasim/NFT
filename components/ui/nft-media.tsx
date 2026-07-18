"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_IPFS_GATEWAYS = [
  // Dedicated Pinata gateway first (not rate-limited); public gateways as
  // fallback. Override with NEXT_PUBLIC_IPFS_GATEWAYS.
  "https://scarlet-worthy-minnow-552.mypinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
];

// Prefer configured gateways (e.g. a dedicated, rate-limit-free gateway) over
// the public defaults. Set NEXT_PUBLIC_IPFS_GATEWAYS to a comma-separated list;
// the first is tried first, the rest are on-error fallbacks.
const IPFS_GATEWAYS = (() => {
  const configured = (process.env.NEXT_PUBLIC_IPFS_GATEWAYS ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map((g) => (g.endsWith("/") ? g : `${g}/`));
  return configured.length > 0 ? configured : DEFAULT_IPFS_GATEWAYS;
})();

const VIDEO_EXTENSIONS = new Set(["mp4", "webm", "mov", "m4v", "ogv"]);
const IMAGE_EXTENSIONS = new Set([
  "png",
  "jpg",
  "jpeg",
  "gif",
  "webp",
  "svg",
  "avif",
]);
const AUDIO_EXTENSIONS = new Set(["mp3", "wav", "oga", "ogg", "flac", "m4a"]);
const MODEL_EXTENSIONS = new Set(["glb", "gltf"]);

type MediaKind = "image" | "video" | "audio" | "model" | "unknown";

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

function uniqueUrls(urls: string[]): string[] {
  return Array.from(new Set(urls));
}

export function mediaCandidates({
  imageUrl,
  animationUrl,
  metadata,
}: Pick<NFTMediaProps, "imageUrl" | "animationUrl" | "metadata">): string[] {
  const ordered = [
    animationUrl,
    metadataString(metadata, "animation_url"),
    metadataString(metadata, "animationUrl"),
    metadataString(metadata, "animation"),
    metadataString(metadata, "animation_url_original"),
    metadataString(metadata, "animation_original_url"),
    metadataString(metadata, "image"),
    metadataString(metadata, "image_url"),
    metadataString(metadata, "imageUrl"),
    metadataString(metadata, "image_original_url"),
    metadataString(metadata, "imageUrlOriginal"),
    imageUrl,
  ];

  return uniqueUrls(ordered.flatMap((url) => normalizeMediaUrls(url ?? null)));
}

function extensionFromUrl(uri: string): string | null {
  const withoutQuery = uri.split(/[?#]/)[0] ?? uri;
  const extension = withoutQuery.split(".").pop()?.toLowerCase();
  return extension || null;
}

export function kindFromExtension(uri: string): MediaKind {
  const extension = extensionFromUrl(uri);
  if (!extension) return "unknown";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";
  if (MODEL_EXTENSIONS.has(extension)) return "model";
  return "unknown";
}

function kindFromContentType(contentType: string | null): MediaKind {
  if (!contentType) return "unknown";
  if (contentType.startsWith("video/")) return "video";
  if (contentType.startsWith("audio/")) return "audio";
  if (contentType.startsWith("image/")) return "image";
  if (contentType.startsWith("model/")) return "model";
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
  const urls = useMemo(
    () => mediaCandidates({ imageUrl, animationUrl, metadata }),
    [animationUrl, imageUrl, metadata]
  );
  // A still image among the candidates that can poster a video. Null in the
  // malformed case where the only candidate is the animation itself.
  const posterUrl = useMemo(
    () => urls.find((u) => kindFromExtension(u) === "image") ?? null,
    [urls]
  );
  const [index, setIndex] = useState(0);
  const [contentTypeKind, setContentTypeKind] = useState<MediaKind>("unknown");

  useEffect(() => {
    setIndex(0);
  }, [urls]);

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
        preload="metadata"
        controls={false}
        poster={posterUrl && posterUrl !== src ? posterUrl : undefined}
        className={className}
        onError={retry}
        aria-label={alt}
      />
    );
  }

  if (kind === "audio") {
    return (
      <audio
        src={src}
        controls
        preload="metadata"
        className={className}
        onError={retry}
        aria-label={alt}
      />
    );
  }

  // model/unknown: try the static image path; onError advances to the next
  // candidate and eventually the fallback tile.
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
