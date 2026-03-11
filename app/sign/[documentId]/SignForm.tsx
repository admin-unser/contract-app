"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

type SignatureData = { type: "typed"; text: string } | { type: "drawing"; dataUrl: string };

export function SignForm({
  documentId,
  signerId,
  pdfUrl,
}: {
  documentId: string;
  signerId: string;
  pdfUrl: string | null;
}) {
  const [signature, setSignature] = useState<SignatureData | null>(null);
  const [typedName, setTypedName] = useState("");
  const [useDrawing, setUseDrawing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  }, []);

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    },
    [isDrawing]
  );

  const endDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignature({ type: "drawing", dataUrl });
  }, []);

  const submitTyped = () => {
    const t = typedName.trim();
    if (!t) return;
    setSignature({ type: "typed", text: t });
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!signature) {
      setError("署名を入力するか、描画してください。");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          signerId,
          signature,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "署名の保存に失敗しました。");
      }
      router.push("/sign/success");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
      {pdfUrl && (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-2">
          <p className="mb-2 text-xs font-medium text-zinc-500">文書プレビュー</p>
          <iframe
            src={pdfUrl}
            title="文書"
            className="h-[360px] w-full rounded border-0"
          />
        </div>
      )}
      {!pdfUrl && (
        <p className="text-sm text-amber-600">プレビューを読み込めませんでした。署名は可能です。</p>
      )}

      <div>
        <p className="text-sm font-medium text-zinc-700">署名</p>
        <div className="mt-2 flex gap-4">
          <button
            type="button"
            onClick={() => setUseDrawing(false)}
            className={`rounded px-3 py-1.5 text-sm ${!useDrawing ? "bg-blue-100 text-blue-800" : "bg-zinc-100 text-zinc-600"}`}
          >
            名前を入力
          </button>
          <button
            type="button"
            onClick={() => setUseDrawing(true)}
            className={`rounded px-3 py-1.5 text-sm ${useDrawing ? "bg-blue-100 text-blue-800" : "bg-zinc-100 text-zinc-600"}`}
          >
            手書き
          </button>
        </div>
        {!useDrawing ? (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="署名する名前"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-zinc-900"
            />
            <button
              type="button"
              onClick={submitTyped}
              className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300"
            >
              反映
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <canvas
              ref={canvasRef}
              width={400}
              height={120}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={endDrawing}
              onMouseLeave={endDrawing}
              className="cursor-crosshair rounded border border-zinc-300 bg-white"
              style={{ touchAction: "none" }}
            />
            <p className="mt-1 text-xs text-zinc-500">マウスで署名を描いてください。</p>
          </div>
        )}
        {signature && (
          <p className="mt-2 text-sm text-green-600">
            {signature.type === "typed" ? `署名: ${signature.text}` : "署名を描画しました。"}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 text-red-700 text-sm p-3">{error}</div>
      )}
      <button
        type="submit"
        disabled={loading || !signature}
        className="w-full rounded-md bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "送信中..." : "署名して完了"}
      </button>
    </form>
  );
}
