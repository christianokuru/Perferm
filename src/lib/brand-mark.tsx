/** Shared monogram used for app icons and social cards (rendered by next/og). */
export function BrandMark({ size, padded = false }: { size: number; padded?: boolean }) {
  const inner = padded ? size * 0.62 : size;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0d1717",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-end", lineHeight: 1 }}>
        <span style={{ color: "#ffffff", fontSize: inner * 0.62, fontWeight: 300, letterSpacing: -inner * 0.03 }}>p</span>
        <span
          style={{
            width: inner * 0.09,
            height: inner * 0.09,
            borderRadius: 999,
            background: "#f15730",
            marginBottom: inner * 0.12,
            marginLeft: inner * 0.02,
          }}
        />
      </div>
    </div>
  );
}
