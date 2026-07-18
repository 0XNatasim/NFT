import { describe, expect, it } from "vitest";
import { kindFromExtension, mediaCandidates } from "@/components/ui/nft-media";

describe("nft media selection", () => {
  it("classifies mp4 as video and png as image by extension", () => {
    expect(kindFromExtension("https://cdn.test/x.mp4")).toBe("video");
    expect(kindFromExtension("https://cdn.test/x.webm")).toBe("video");
    expect(kindFromExtension("https://cdn.test/x.png")).toBe("image");
    expect(kindFromExtension("https://cdn.test/x.glb")).toBe("model");
    expect(kindFromExtension("https://cdn.test/x.mp3")).toBe("audio");
    expect(kindFromExtension("https://cdn.test/noext")).toBe("unknown");
  });

  it("routes an mp4 in metadata.image to a video candidate", () => {
    const urls = mediaCandidates({
      imageUrl: null,
      animationUrl: null,
      metadata: { image: "https://cdn.test/token.mp4" },
    });
    expect(urls[0]).toBe("https://cdn.test/token.mp4");
    expect(kindFromExtension(urls[0]!)).toBe("video");
  });

  it("dedupes an identical image + animation_url (malformed Erebus) to one video", () => {
    const mp4 = "https://cdn.test/erebus.mp4";
    const urls = mediaCandidates({
      imageUrl: mp4,
      animationUrl: mp4,
      metadata: { image: mp4, animation_url: mp4 },
    });
    expect(urls).toEqual([mp4]);
    expect(kindFromExtension(urls[0]!)).toBe("video");
    // No static image candidate exists, so there is no poster to fall back to.
    expect(urls.find((u) => kindFromExtension(u) === "image")).toBeUndefined();
  });

  it("keeps a static image poster candidate when both media exist", () => {
    const urls = mediaCandidates({
      imageUrl: "https://cdn.test/poster.png",
      animationUrl: "https://cdn.test/clip.mp4",
      metadata: null,
    });
    expect(urls.find((u) => kindFromExtension(u) === "video")).toBe(
      "https://cdn.test/clip.mp4",
    );
    expect(urls.find((u) => kindFromExtension(u) === "image")).toBe(
      "https://cdn.test/poster.png",
    );
  });
});
