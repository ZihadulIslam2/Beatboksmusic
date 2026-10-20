"use client";

import { useEffect, useMemo, useState } from "react";
import Image, { type ImageProps } from "next/image";

type FallbackImageProps = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  fallbackSrc?: string | Array<string | null | undefined> | null;
  placeholderSrc?: string;
};

function normalizeSources(
  src?: string | null,
  fallbackSrc?: string | Array<string | null | undefined> | null,
  placeholderSrc = "/albam.png",
) {
  const fallbackSources = Array.isArray(fallbackSrc)
    ? fallbackSrc
    : [fallbackSrc];
  const sources = [src, ...fallbackSources, placeholderSrc];
  const seen = new Set<string>();

  return sources.reduce<string[]>((acc, source) => {
    const cleanSource = source?.trim();

    if (cleanSource && !seen.has(cleanSource)) {
      seen.add(cleanSource);
      acc.push(cleanSource);
    }

    return acc;
  }, []);
}

export default function FallbackImage({
  src,
  fallbackSrc,
  placeholderSrc = "/albam.png",
  ...props
}: FallbackImageProps) {
  const sourceKey = [
    src,
    ...(Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc]),
    placeholderSrc,
  ]
    .filter(Boolean)
    .join("\u0000");
  const sources = useMemo(
    () => normalizeSources(src, fallbackSrc, placeholderSrc),
    [sourceKey],
  );
  const [sourceIndex, setSourceIndex] = useState(0);
  const currentSource = sources[sourceIndex] || placeholderSrc;

  useEffect(() => {
    setSourceIndex(0);
  }, [sourceKey]);

  return (
    <Image
      {...props}
      src={currentSource}
      onError={() => {
        setSourceIndex((currentIndex) =>
          currentIndex < sources.length - 1 ? currentIndex + 1 : currentIndex,
        );
      }}
    />
  );
}
