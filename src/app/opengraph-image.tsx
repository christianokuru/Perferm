import { ImageResponse } from "next/og";

export const alt = "Perferm — Arabian & niche luxury perfume, delivered across Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Default social card: whisper-weight wordmark on Inkwell with a saffron accent. */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1717",
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 12, opacity: 0.85 }}>PERFERM · LAGOS</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 300, letterSpacing: -6, lineHeight: 0.95 }}>the art of</div>
          <div style={{ display: "flex", alignItems: "center", fontSize: 120, fontWeight: 300, letterSpacing: -6, lineHeight: 0.95 }}>
            arabian luxury
            <span style={{ width: 28, height: 28, borderRadius: 999, background: "#f15730", marginLeft: 18, marginTop: 40 }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.75 }}>
          <span>Ouds · Attars · Niche perfumery</span>
          <span>Delivered to all 36 states</span>
        </div>
      </div>
    ),
    size,
  );
}
