"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SignatureMode = "draw" | "type" | "stamp";

const SIGNATURE_FONTS = [
  { name: "手書き風", family: "'Caveat', cursive", weight: "400" },
  { name: "楷書風", family: "serif", weight: "600" },
  { name: "ゴシック", family: "sans-serif", weight: "700" },
  { name: "明朝", family: "'Noto Serif JP', serif", weight: "500" },
];

const STAMP_COLORS = [
  { name: "朱色", color: "#C41E3A" },
  { name: "赤", color: "#E53935" },
  { name: "紺", color: "#1A237E" },
];

interface SignatureGeneratorProps {
  signerName: string;
  companyName?: string;
  onComplete: (data: { type: "typed"; text: string } | { type: "drawing"; dataUrl: string } | { type: "stamp"; dataUrl: string }) => void;
  onCancel?: () => void;
}

export function SignatureGenerator({ signerName, companyName, onComplete, onCancel }: SignatureGeneratorProps) {
  const [mode, setMode] = useState<SignatureMode>("type");
  const [typedName, setTypedName] = useState(signerName);
  const [selectedFont, setSelectedFont] = useState(0);
  const [stampColor, setStampColor] = useState(0);
  const [stampShape, setStampShape] = useState<"circle" | "oval">("circle");
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);

  // Draw signature preview
  const drawTypedPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "type") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const font = SIGNATURE_FONTS[selectedFont];
    const fontSize = Math.min(48, (canvas.width - 40) / (typedName.length || 1) * 1.5);
    ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
    ctx.fillStyle = "#111";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName || signerName, canvas.width / 2, canvas.height / 2);
  }, [mode, typedName, selectedFont, signerName]);

  useEffect(() => {
    drawTypedPreview();
  }, [drawTypedPreview]);

  // Draw stamp preview
  const drawStampPreview = useCallback(() => {
    const canvas = stampCanvasRef.current;
    if (!canvas || mode !== "stamp") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const color = STAMP_COLORS[stampColor].color;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const name = typedName || signerName;

    if (stampShape === "circle") {
      const radius = Math.min(canvas.width, canvas.height) / 2 - 8;
      // Outer circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      // Inner circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius - 4, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Name text
      const chars = name.split("");
      if (chars.length <= 2) {
        // Vertical layout for 1-2 chars
        const fontSize = radius * 0.8;
        ctx.font = `bold ${fontSize}px serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (chars.length === 1) {
          ctx.fillText(chars[0], cx, cy);
        } else {
          ctx.fillText(chars[0], cx, cy - fontSize * 0.45);
          ctx.fillText(chars[1], cx, cy + fontSize * 0.45);
        }
      } else if (chars.length <= 4) {
        // 2x2 grid
        const fontSize = radius * 0.55;
        ctx.font = `bold ${fontSize}px serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const rows = chars.length <= 2 ? 1 : 2;
        const cols = Math.ceil(chars.length / rows);
        for (let i = 0; i < chars.length; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const x = cx + (col - (cols - 1) / 2) * fontSize * 0.9;
          const y = cy + (row - (rows - 1) / 2) * fontSize * 1.0;
          ctx.fillText(chars[i], x, y);
        }
      } else {
        // Fit text in circle
        const fontSize = Math.min(radius * 0.45, (radius * 1.5) / chars.length * 2);
        ctx.font = `bold ${fontSize}px serif`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const halfLen = Math.ceil(chars.length / 2);
        const line1 = name.slice(0, halfLen);
        const line2 = name.slice(halfLen);
        ctx.fillText(line1, cx, cy - fontSize * 0.5);
        ctx.fillText(line2, cx, cy + fontSize * 0.5);
      }
    } else {
      // Oval stamp
      const rx = canvas.width / 2 - 8;
      const ry = canvas.height / 2 - 8;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.stroke();

      // Company name on top, name on bottom
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (companyName) {
        const compFontSize = Math.min(16, (rx * 1.4) / companyName.length * 1.8);
        ctx.font = `bold ${compFontSize}px serif`;
        ctx.fillText(companyName, cx, cy - ry * 0.3);
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(cx - rx * 0.6, cy);
        ctx.lineTo(cx + rx * 0.6, cy);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      const nameFontSize = Math.min(22, (rx * 1.4) / name.length * 1.8);
      ctx.font = `bold ${nameFontSize}px serif`;
      ctx.fillText(name, cx, companyName ? cy + ry * 0.3 : cy);
    }
  }, [mode, typedName, signerName, companyName, stampColor, stampShape]);

  useEffect(() => {
    drawStampPreview();
  }, [drawStampPreview]);

  // Drawing handlers
  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!hasDrawn) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x: number, y: number;
    if ("touches" in e) {
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  }, [hasDrawn]);

  const doDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let x: number, y: number;
    if ("touches" in e) {
      e.preventDefault();
      x = (e.touches[0].clientX - rect.left) * scaleX;
      y = (e.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (e.clientX - rect.left) * scaleX;
      y = (e.clientY - rect.top) * scaleY;
    }
    ctx.lineTo(x, y);
    ctx.stroke();
  }, [isDrawing]);

  const endDraw = useCallback(() => {
    setIsDrawing(false);
  }, []);

  function clearDraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleConfirm() {
    if (mode === "type") {
      const text = typedName.trim() || signerName;
      onComplete({ type: "typed", text });
    } else if (mode === "draw") {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) return;
      onComplete({ type: "drawing", dataUrl: canvas.toDataURL("image/png") });
    } else if (mode === "stamp") {
      const canvas = stampCanvasRef.current;
      if (!canvas) return;
      onComplete({ type: "stamp", dataUrl: canvas.toDataURL("image/png") });
    }
  }

  const isValid = mode === "type" ? (typedName.trim() || signerName) : mode === "draw" ? hasDrawn : true;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-sm font-bold text-gray-800">署名を作成</h2>
        <p className="text-xs text-gray-500 mt-0.5">テキスト入力・手書き・印鑑から選択してください</p>
      </div>

      {/* Mode tabs */}
      <div className="flex border-b border-gray-100">
        {([
          { key: "type" as const, label: "テキスト入力", icon: "Aa" },
          { key: "draw" as const, label: "手書き", icon: "✍" },
          { key: "stamp" as const, label: "印鑑", icon: "印" },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMode(tab.key)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all ${
              mode === tab.key
                ? "text-blue-700 border-b-2 border-blue-600 bg-blue-50/50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="mr-1.5">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* Type mode */}
        {mode === "type" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">署名テキスト</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={signerName}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">フォントスタイル</label>
              <div className="grid grid-cols-2 gap-2">
                {SIGNATURE_FONTS.map((font, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedFont(i)}
                    className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                      selectedFont === i
                        ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500"
                        : "border-gray-200 hover:border-gray-300 text-gray-600"
                    }`}
                  >
                    <span style={{ fontFamily: font.family, fontWeight: parseInt(font.weight) }}>
                      {typedName || signerName}
                    </span>
                    <span className="block text-[10px] text-gray-400 mt-0.5">{font.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center" style={{ minHeight: 80 }}>
              <canvas ref={canvasRef} width={500} height={120} className="max-w-full" />
            </div>
          </>
        )}

        {/* Draw mode */}
        {mode === "draw" && (
          <>
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDraw}
                onMouseMove={doDraw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={doDraw}
                onTouchEnd={endDraw}
                className="w-full cursor-crosshair rounded-lg border-2 border-dashed border-gray-300 bg-white hover:border-blue-300 transition-colors"
                style={{ touchAction: "none" }}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-300 text-sm">ここに署名を描いてください</span>
                </div>
              )}
              {hasDrawn && (
                <button
                  type="button"
                  onClick={clearDraw}
                  className="absolute top-2 right-2 rounded-lg bg-white/90 backdrop-blur border border-gray-200 px-2.5 py-1 text-xs text-gray-500 hover:text-red-500 transition-colors"
                >
                  クリア
                </button>
              )}
            </div>
            <p className="text-xs text-gray-400">マウスまたはタッチで署名を描いてください</p>
          </>
        )}

        {/* Stamp mode */}
        {mode === "stamp" && (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">印影の名前</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={signerName}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">形状</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStampShape("circle")}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                      stampShape === "circle" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border-2 border-current text-red-500" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStampShape("oval")}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                      stampShape === "oval" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                    }`}
                  >
                    <div className="w-7 h-5 rounded-full border-2 border-current text-red-500" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">色</label>
                <div className="flex gap-2">
                  {STAMP_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStampColor(i)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                        stampColor === i ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: c.color }} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <canvas
                ref={stampCanvasRef}
                width={stampShape === "circle" ? 160 : 200}
                height={160}
                className="max-w-[160px]"
              />
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            キャンセル
          </button>
        )}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          この署名を使用
        </button>
      </div>
    </div>
  );
}
