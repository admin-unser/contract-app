import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          borderRadius: "36px",
          background: "linear-gradient(135deg, #1a365d, #312e81)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "white", fontSize: "110px", fontWeight: "bold" }}>M</span>
      </div>
    ),
    { ...size }
  );
}
