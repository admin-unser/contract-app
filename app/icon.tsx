import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "6px",
          background: "linear-gradient(135deg, #1a365d, #312e81)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ color: "white", fontSize: "20px", fontWeight: "bold" }}>M</span>
      </div>
    ),
    { ...size }
  );
}
