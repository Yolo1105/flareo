import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Flareo. Container supply chain.";

/**
 * Social card for link previews. Uses system fonts so there is no runtime
 * font fetch; the real site swaps to Archivo Black via next/font once the
 * page loads. This image only needs to look composed at a glance in a
 * Twitter or Slack card.
 */
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1A1614",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 72,
            right: 80,
            fontFamily: "monospace",
            fontSize: 18,
            letterSpacing: "0.14em",
            color: "#EA442A",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ width: 8, height: 8, background: "#EA442A" }} />
          V0.4.2 &middot; PUBLIC BETA
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div
            style={{
              width: 42,
              height: 42,
              background: "#EA442A",
              clipPath: "polygon(0 0, 100% 0, 100% 60%, 60% 100%, 0 100%)",
            }}
          />
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: "#EAE4DA",
              letterSpacing: "-0.02em",
            }}
          >
            FLAREO
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 900,
              color: "#EAE4DA",
              letterSpacing: "-0.035em",
              lineHeight: 0.95,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>VERIFIED CONTAINERS.</span>
            <span>PREVIEWED LIVE.</span>
            <span>DEPLOYED ON YOUR BOX.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#BCB4A8",
              marginTop: 24,
              maxWidth: 920,
              lineHeight: 1.4,
            }}
          >
            Development as product. Delivery as service. Cryptographic
            receipts for every byte.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "monospace",
            fontSize: 18,
            color: "#7A7268",
            letterSpacing: "0.08em",
            marginTop: 48,
          }}
        >
          <div>flareo.sh</div>
          <div style={{ color: "#5FBF7F" }}>
            12 MODULES &middot; 41 BUILDS 7D &middot; 87% SCAN PASS
          </div>
        </div>
      </div>
    ),
    size
  );
}
