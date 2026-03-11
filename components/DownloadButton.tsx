export function DownloadButton({ documentId }: { documentId: string }) {
  return (
    <a
      href={`/api/documents/${documentId}/download`}
      className="inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
    >
      完了版 PDF をダウンロード
    </a>
  );
}
