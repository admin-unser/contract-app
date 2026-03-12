"use client";

import { useState, useRef } from "react";

interface OtpVerificationProps {
  token: string;
  onVerified: () => void;
}

export function OtpVerification({ token, onVerified }: OtpVerificationProps) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  async function requestOtp() {
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSent(true);
      setMaskedEmail(data.email?.replace(/(.{2}).*(@.*)/, "$1***$2") ?? null);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setSending(false);
    }
  }

  function handleInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits filled
    if (newCode.every((d) => d) && value) {
      verifyOtp(newCode.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      verifyOtp(pasted);
    }
  }

  async function verifyOtp(fullCode: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, code: fullCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : "認証に失敗しました。");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  if (!sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-500">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="M22 7l-10 6L2 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">本人確認</h2>
          <p className="text-sm text-gray-500 mt-1">
            署名を行うために、メールアドレスの確認が必要です。
          </p>
        </div>
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}
        <button
          onClick={requestOtp}
          disabled={sending}
          className="w-full rounded-lg bg-blue-600 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
        >
          {sending ? "送信中..." : "認証コードを送信"}
        </button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-blue-500">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <circle cx="12" cy="16" r="1" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">認証コード入力</h2>
        <p className="text-sm text-gray-500 mt-1">
          {maskedEmail ? `${maskedEmail} に送信された6桁のコードを入力してください。` : "メールに送信された6桁のコードを入力してください。"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            disabled={loading}
            className="w-12 h-14 text-center text-xl font-bold rounded-lg border border-gray-300 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        ))}
      </div>

      {loading && (
        <p className="text-sm text-blue-600">認証中...</p>
      )}

      <div className="pt-2">
        <button
          onClick={requestOtp}
          disabled={sending}
          className="text-sm text-blue-600 hover:underline disabled:opacity-50"
        >
          {sending ? "送信中..." : "コードを再送信"}
        </button>
      </div>
    </div>
  );
}
