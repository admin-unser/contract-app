"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type SignatureMode = "type" | "draw" | "stamp";
type DrawTool = "pen" | "eraser";

const SIGNATURE_FONTS = [
  { name: "手書き風", family: "'Caveat', cursive", weight: "400", sample: "流" },
  { name: "楷書風", family: "serif", weight: "600", sample: "楷" },
  { name: "ゴシック", family: "sans-serif", weight: "700", sample: "ゴ" },
  { name: "明朝", family: "'Noto Serif JP', serif", weight: "500", sample: "明" },
];

const STAMP_COLORS = [
  { name: "朱色", color: "#C41E3A", bg: "bg-red-50", ring: "ring-red-200" },
  { name: "赤", color: "#E53935", bg: "bg-rose-50", ring: "ring-rose-200" },
  { name: "紺", color: "#1A237E", bg: "bg-indigo-50", ring: "ring-indigo-200" },
  { name: "黒", color: "#1a1a1a", bg: "bg-gray-50", ring: "ring-gray-200" },
];

const PEN_SIZES = [
  { label: "細", size: 1.5 },
  { label: "中", size: 2.5 },
  { label: "太", size: 4 },
];

const INK_COLORS = [
  { name: "黒", color: "#111111" },
  { name: "紺", color: "#1e3a5f" },
  { name: "青", color: "#1a56db" },
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
  const [stampOrientation, setStampOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [inkColor, setInkColor] = useState(0);

  // Drawing state
  const [drawTool, setDrawTool] = useState<DrawTool>("pen");
  const [penSize, setPenSize] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [drawHistory, setDrawHistory] = useState<ImageData[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stampCanvasRef = useRef<HTMLCanvasElement>(null);

  // ─── Type Mode Preview ───
  const drawTypedPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "type") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const font = SIGNATURE_FONTS[selectedFont];
    const name = typedName || signerName;
    const fontSize = Math.min(56, (canvas.width - 60) / (name.length || 1) * 1.5);
    ctx.font = `${font.weight} ${fontSize}px ${font.family}`;
    ctx.fillStyle = "#1a1a1a";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(name, canvas.width / 2, canvas.height / 2);
  }, [mode, typedName, selectedFont, signerName]);

  useEffect(() => {
    drawTypedPreview();
  }, [drawTypedPreview]);

  // ─── Stamp Mode Preview ───
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
      const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
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

      const chars = name.split("");
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (stampOrientation === "vertical") {
        if (chars.length <= 2) {
          const fontSize = radius * 0.8;
          ctx.font = `bold ${fontSize}px serif`;
          if (chars.length === 1) {
            ctx.fillText(chars[0], cx, cy);
          } else {
            ctx.fillText(chars[0], cx, cy - fontSize * 0.45);
            ctx.fillText(chars[1], cx, cy + fontSize * 0.45);
          }
        } else if (chars.length <= 4) {
          const fontSize = radius * 0.55;
          ctx.font = `bold ${fontSize}px serif`;
          const rows = Math.ceil(chars.length / 2);
          const cols = 2;
          for (let i = 0; i < chars.length; i++) {
            const col = Math.floor(i / rows);
            const row = i % rows;
            const x = cx + ((cols - 1) / 2 - col) * fontSize * 0.9;
            const y = cy + (row - (rows - 1) / 2) * fontSize * 1.0;
            ctx.fillText(chars[i], x, y);
          }
        } else {
          const fontSize = Math.min(radius * 0.4, (radius * 1.4) / Math.ceil(chars.length / 2));
          ctx.font = `bold ${fontSize}px serif`;
          const halfLen = Math.ceil(chars.length / 2);
          const col1 = chars.slice(0, halfLen);
          const col2 = chars.slice(halfLen);
          const colWidth = fontSize * 0.95;
          for (let i = 0; i < col1.length; i++) {
            ctx.fillText(col1[i], cx + colWidth / 2, cy + (i - (col1.length - 1) / 2) * fontSize);
          }
          for (let i = 0; i < col2.length; i++) {
            ctx.fillText(col2[i], cx - colWidth / 2, cy + (i - (col2.length - 1) / 2) * fontSize);
          }
        }
      } else {
        if (chars.length <= 3) {
          const fontSize = Math.min(radius * 0.7, (radius * 1.4) / chars.length);
          ctx.font = `bold ${fontSize}px serif`;
          ctx.fillText(name, cx, cy);
        } else {
          const fontSize = Math.min(radius * 0.45, (radius * 1.5) / Math.ceil(chars.length / 2) * 2);
          ctx.font = `bold ${fontSize}px serif`;
          const halfLen = Math.ceil(chars.length / 2);
          ctx.fillText(name.slice(0, halfLen), cx, cy - fontSize * 0.5);
          ctx.fillText(name.slice(halfLen), cx, cy + fontSize * 0.5);
        }
      }
    } else {
      // Oval stamp
      const rx = canvas.width / 2 - 10;
      const ry = canvas.height / 2 - 10;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx - 4, ry - 4, 0, 0, Math.PI * 2);
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (companyName) {
        const compFontSize = Math.min(16, (rx * 1.4) / companyName.length * 1.8);
        ctx.font = `bold ${compFontSize}px serif`;
        ctx.fillText(companyName, cx, cy - ry * 0.3);
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
  }, [mode, typedName, signerName, companyName, stampColor, stampShape, stampOrientation]);

  useEffect(() => {
    drawStampPreview();
  }, [drawStampPreview]);

  // ─── Drawing Handlers ───
  const startDraw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (hasDrawn) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawHistory((prev) => [...prev.slice(-19), imgData]);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (drawTool === "pen") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = INK_COLORS[inkColor].color;
      ctx.lineWidth = PEN_SIZES[penSize].size;
    } else {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = 20;
    }
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
  }, [hasDrawn, drawTool, penSize, inkColor]);

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
    if (isDrawing) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.globalCompositeOperation = "source-over";
      }
    }
    setIsDrawing(false);
  }, [isDrawing]);

  function handleUndo() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (drawHistory.length > 0) {
      const prev = drawHistory[drawHistory.length - 1];
      ctx.putImageData(prev, 0, 0);
      setDrawHistory((h) => h.slice(0, -1));
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    }
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (hasDrawn) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawHistory((prev) => [...prev.slice(-19), imgData]);
    }
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

  const TABS: { key: SignatureMode; label: string; sublabel: string; icon: React.ReactNode }[] = [
    {
      key: "type",
      label: "スタイルで作成",
      sublabel: "フォントを選んで署名",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M4 7V4h16v3" /><path d="M9 20h6" /><path d="M12 4v16" />
        </svg>
      ),
    },
    {
      key: "draw",
      label: "手書きで描く",
      sublabel: "ペンで自由に署名",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      ),
    },
    {
      key: "stamp",
      label: "印鑑を作成",
      sublabel: "印影を自動生成",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <circle cx="12" cy="10" r="7" /><path d="M12 3v0" /><path d="M5 21h14" /><path d="M5 21v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
        </svg>
      ),
    },
  ];

  return (
    <div className="rounded-2xl bg-white shadow-2xl overflow-hidden w-full max-w-xl">
      {/* ───── Header ───── */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">署名を作成</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {signerName}
              {companyName && <span className="text-gray-400"> · {companyName}</span>}
            </p>
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ───── Mode Tabs ───── */}
      <div className="px-6">
        <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                mode === tab.key
                  ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <span className={mode === tab.key ? "text-blue-600" : "text-gray-400"}>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ───── Content ───── */}
      <div className="px-6 pt-5 pb-6">
        {/* ────── Type Mode ────── */}
        {mode === "type" && (
          <div className="space-y-5">
            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">署名テキスト</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={signerName}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Font selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">フォントスタイル</label>
              <div className="grid grid-cols-4 gap-2">
                {SIGNATURE_FONTS.map((font, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedFont(i)}
                    className={`group relative px-3 py-3 rounded-xl border-2 text-center transition-all ${
                      selectedFont === i
                        ? "border-blue-500 bg-blue-50/50 shadow-sm"
                        : "border-gray-150 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span
                      className="block text-lg leading-tight text-gray-800"
                      style={{ fontFamily: font.family, fontWeight: parseInt(font.weight) }}
                    >
                      {(typedName || signerName).slice(0, 3)}
                    </span>
                    <span className={`block text-[10px] mt-1 ${selectedFont === i ? "text-blue-600 font-medium" : "text-gray-400"}`}>
                      {font.name}
                    </span>
                    {selectedFont === i && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-3 h-3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">プレビュー</label>
              <div className="relative bg-gradient-to-b from-gray-50 to-white rounded-xl border border-gray-200 p-5 flex items-center justify-center overflow-hidden" style={{ minHeight: 100 }}>
                <canvas ref={canvasRef} width={500} height={120} className="max-w-full" />
                {/* Signature line */}
                <div className="absolute bottom-4 left-8 right-8 border-b border-gray-200" />
              </div>
            </div>
          </div>
        )}

        {/* ────── Draw Mode ────── */}
        {mode === "draw" && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex items-center gap-3">
              {/* Tool toggle */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => setDrawTool("pen")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    drawTool === "pen"
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                  ペン
                </button>
                <button
                  type="button"
                  onClick={() => setDrawTool("eraser")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    drawTool === "eraser"
                      ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
                    <path d="M22 21H7" /><path d="m5 11 9 9" />
                  </svg>
                  消しゴム
                </button>
              </div>

              {/* Pen size */}
              {drawTool === "pen" && (
                <div className="flex items-center gap-1">
                  {PEN_SIZES.map((ps, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPenSize(i)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        penSize === i
                          ? "bg-gray-900 ring-2 ring-gray-900/20"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      title={ps.label}
                    >
                      <div
                        className="rounded-full"
                        style={{
                          width: ps.size * 2.5,
                          height: ps.size * 2.5,
                          backgroundColor: penSize === i ? "white" : "#666",
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Ink color (pen only) */}
              {drawTool === "pen" && (
                <div className="flex items-center gap-1 ml-1">
                  {INK_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setInkColor(i)}
                      className={`w-6 h-6 rounded-full transition-all ${
                        inkColor === i ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              )}

              <div className="flex-1" />

              {/* Actions */}
              <button
                type="button"
                onClick={handleUndo}
                disabled={!hasDrawn && drawHistory.length === 0}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-25 transition-all"
                title="元に戻す (Ctrl+Z)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                </svg>
              </button>
              <button
                type="button"
                onClick={clearDraw}
                disabled={!hasDrawn}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-25 transition-all"
                title="すべてクリア"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </button>
            </div>

            {/* Canvas */}
            <div className="relative rounded-xl overflow-hidden">
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
                className={`w-full bg-white rounded-xl border-2 transition-all ${
                  drawTool === "pen"
                    ? "cursor-crosshair border-gray-200 hover:border-blue-300 focus:border-blue-400"
                    : "cursor-cell border-orange-200 hover:border-orange-300"
                }`}
                style={{ touchAction: "none" }}
              />
              {/* Signature line */}
              <div className="absolute bottom-5 left-8 right-8 border-b border-dashed border-gray-300 pointer-events-none" />
              {/* Placeholder */}
              {!hasDrawn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-gray-200">
                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  </svg>
                  <span className="text-gray-300 text-sm font-medium">ここに署名を描いてください</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ────── Stamp Mode ────── */}
        {mode === "stamp" && (
          <div className="space-y-5">
            {/* Name input */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">印影の名前</label>
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={signerName}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Options row */}
            <div className="flex items-start gap-6">
              {/* Shape */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">形状</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStampShape("circle")}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                      stampShape === "circle" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full border-2" style={{ borderColor: STAMP_COLORS[stampColor].color }} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStampShape("oval")}
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                      stampShape === "oval" ? "border-blue-500 bg-blue-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="w-8 h-5 rounded-full border-2" style={{ borderColor: STAMP_COLORS[stampColor].color }} />
                  </button>
                </div>
              </div>

              {/* Orientation (circle only) */}
              {stampShape === "circle" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">文字方向</label>
                  <div className="flex bg-gray-100 rounded-xl p-1">
                    <button
                      type="button"
                      onClick={() => setStampOrientation("vertical")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        stampOrientation === "vertical"
                          ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      縦書き
                    </button>
                    <button
                      type="button"
                      onClick={() => setStampOrientation("horizontal")}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        stampOrientation === "horizontal"
                          ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      横書き
                    </button>
                  </div>
                </div>
              )}

              {/* Color */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">色</label>
                <div className="flex gap-2">
                  {STAMP_COLORS.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStampColor(i)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                        stampColor === i ? "ring-2 ring-offset-2 ring-blue-500 scale-110" : "hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    >
                      {stampColor === i && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-4 h-4">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stamp preview */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">プレビュー</label>
              <div className="relative bg-gradient-to-b from-amber-50/30 to-white rounded-xl border border-gray-200 flex items-center justify-center py-8">
                <canvas
                  ref={stampCanvasRef}
                  width={stampShape === "circle" ? 180 : 220}
                  height={180}
                  className="max-w-[180px] drop-shadow-sm"
                />
                {/* Subtle paper texture hint */}
                <div className="absolute inset-0 rounded-xl opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ───── Footer Actions ───── */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center gap-3">
        {/* Legal disclaimer */}
        <p className="text-[10px] text-gray-400 leading-tight flex-1">
          「署名を確定」をクリックすると、この署名を本文書への電子署名として使用することに同意したものとみなされます。
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValid}
          className="relative rounded-xl bg-blue-600 px-7 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md flex items-center gap-2 flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          署名を確定
        </button>
      </div>
    </div>
  );
}
