"use client";

export function CopySignLinkButton({ url }: { url: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(url);
        const btn = document.activeElement as HTMLButtonElement;
        if (btn) {
          const orig = btn.textContent;
          btn.textContent = "コピーしました";
          setTimeout(() => {
            btn.textContent = orig;
          }, 1500);
        }
      }}
      className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
    >
      リンクをコピー
    </button>
  );
}
