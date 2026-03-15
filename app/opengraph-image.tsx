import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MUSUBI sign - 契約を、結ぶ。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a365d 0%, #312e81 50%, #4f46e5 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "20px",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            <span style={{ color: "white", fontSize: "48px", fontWeight: "bold" }}>M</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: "white", fontSize: "56px", fontWeight: "bold", letterSpacing: "-1px" }}>
              MUSUBI sign
            </span>
          </div>
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.9)",
            fontSize: "36px",
            fontWeight: "normal",
            marginBottom: "16px",
          }}
        >
          契約を、結ぶ。
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: "20px",
            fontWeight: "normal",
          }}
        >
          AI契約リスク検出搭載 電子契約プラットフォーム
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            right: "40px",
            color: "rgba(255,255,255,0.4)",
            fontSize: "16px",
          }}
        >
          UNSER LLC
        </div>
      </div>
    ),
    { ...size }
  );
}
