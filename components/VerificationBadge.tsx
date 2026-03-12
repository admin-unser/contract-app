"use client";

export function VerificationBadge({
  documentHash,
  chainHash,
}: {
  documentHash: string | null;
  chainHash: string | null;
}) {
  const hash = chainHash || documentHash;
  if (!hash) return null;

  const verifyUrl = `/verify/${hash}`;

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      <div className="flex items-center gap-2 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-green-600">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <span className="text-sm font-semibold text-green-800">電子署名検証</span>
      </div>
      <div className="space-y-1.5">
        {documentHash && (
          <div>
            <div className="text-xs text-green-600">文書ハッシュ</div>
            <div className="text-xs font-mono text-green-700 break-all">{documentHash.slice(0, 16)}...{documentHash.slice(-8)}</div>
          </div>
        )}
        {chainHash && (
          <div>
            <div className="text-xs text-green-600">チェーンハッシュ</div>
            <div className="text-xs font-mono text-green-700 break-all">{chainHash.slice(0, 16)}...{chainHash.slice(-8)}</div>
          </div>
        )}
      </div>
      <a
        href={verifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 font-medium"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        公開検証ページで確認
      </a>
    </div>
  );
}
