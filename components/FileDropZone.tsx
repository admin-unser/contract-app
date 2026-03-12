"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function FileDropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        alert("PDFファイルのみアップロードできます。");
        return;
      }
      // Navigate to new document page - we'll let the user add signers there
      router.push("/documents/new");
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`mb-6 rounded-xl border-2 border-dashed bg-white p-10 text-center transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className="text-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
            <circle cx="17" cy="17" r="3" />
            <line x1="17" y1="15.5" x2="17" y2="18.5" />
            <line x1="15.5" y1="17" x2="18.5" y2="17" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">ファイルをドロップするもしくは</p>
        <button
          onClick={() => router.push("/documents/new")}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-8 transition-colors text-sm"
        >
          ファイルを選択して署名を依頼
        </button>
      </div>
    </div>
  );
}
