export default function SignSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-green-500">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-800">署名が完了しました</h1>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          署名が正常に記録されました。<br />
          文書の送信者に通知が送信されます。
        </p>
        <div className="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4">
          <div className="flex items-center gap-2 justify-center text-xs text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            UNSER Sign による電子署名
          </div>
          <p className="text-xs text-gray-400 mt-1">
            署名データは暗号化ハッシュで保護されています
          </p>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          このページを閉じて問題ありません。
        </p>
      </div>
    </div>
  );
}
