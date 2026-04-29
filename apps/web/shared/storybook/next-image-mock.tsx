/* eslint-disable @next/next/no-img-element */
import type { ImgHTMLAttributes } from "react";

type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  fill?: boolean;
  priority?: boolean;
  src: string | { src: string };
  unoptimized?: boolean;
};

export default function Image({ fill, priority, src, unoptimized, alt = "", ...props }: ImageProps) {
  void unoptimized;

  const { height, loading, style, width, ...imageProps } = props;
  const resolvedSrc = typeof src === "string" ? src : src.src;
  const resolvedStyle = fill
    ? {
        ...style,
        height: "100%",
        inset: 0,
        objectFit: style?.objectFit ?? "cover",
        position: "absolute" as const,
        width: "100%",
      }
    : style;

  return (
    <img
      alt={alt}
      height={height ?? 1}
      loading={priority ? "eager" : loading}
      src={resolvedSrc}
      style={resolvedStyle}
      width={width ?? 1}
      {...imageProps}
    />
  );
}
