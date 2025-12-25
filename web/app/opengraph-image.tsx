import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "2025 Best9 - Instagram Best 9 Collage";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #f8f8f8 0%, #ffffff 60%)",
          padding: 60,
          fontFamily: "Arial, sans-serif",
          color: "#111111",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 28, letterSpacing: 2 }}>2025</div>
            <div style={{ fontSize: 64, fontWeight: 700 }}>Best9</div>
            <div style={{ fontSize: 24, color: "#555555" }}>
              Your top 9 Instagram posts in a 3x3 grid
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 90px)",
              gridAutoRows: "90px",
              gap: 10,
              padding: 16,
              background: "#ffffff",
              borderRadius: 20,
              boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
            }}
          >
            {Array.from({ length: 9 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 12,
                  background: idx % 2 === 0 ? "#111111" : "#e9e9e9",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, color: "#777777" }}>
          <span>2025best9.vercel.app</span>
          <span>Free & instant</span>
        </div>
      </div>
    ),
    {
      width: size.width,
      height: size.height,
    }
  );
}
