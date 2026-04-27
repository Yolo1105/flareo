import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/**
 * Favicon. 32x32 faceted orange mark on warm charcoal background, matching
 * the BrandMark component used throughout the site.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A1614",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            background: "#EA442A",
            clipPath: "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)",
          }}
        />
      </div>
    ),
    size
  );
}
