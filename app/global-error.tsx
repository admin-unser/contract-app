"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #1a365d, #312e81)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <span style={{ color: "#fff", fontWeight: "bold", fontSize: 28 }}>M</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: "bold", color: "#111", marginBottom: 8 }}>システムエラー</h1>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 32, textAlign: "center", maxWidth: 400 }}>
            予期しないエラーが発生しました。ページを再読み込みしてください。
          </p>
          <button
            onClick={reset}
            style={{
              padding: "10px 24px",
              borderRadius: 8,
              background: "linear-gradient(to right, #1a365d, #312e81)",
              color: "#fff",
              fontWeight: "bold",
              fontSize: 14,
              border: "none",
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
          {error.digest && (
            <p style={{ marginTop: 24, fontSize: 12, color: "#d1d5db" }}>Error ID: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
