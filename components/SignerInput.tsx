"use client";

export interface SignerRow {
  company_name: string;
  name: string;
  email: string;
}

interface SignerInputProps {
  signers: SignerRow[];
  onChange: (signers: SignerRow[]) => void;
}

export function SignerInput({ signers, onChange }: SignerInputProps) {
  function updateRow(index: number, field: keyof SignerRow, value: string) {
    const updated = [...signers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  }

  function addRow() {
    onChange([...signers, { company_name: "", name: "", email: "" }]);
  }

  function removeRow(index: number) {
    if (signers.length <= 1) return;
    onChange(signers.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {signers.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2.5 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-medium flex-shrink-0">
            {i + 1}
          </span>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <input
              value={s.company_name}
              onChange={(e) => updateRow(i, "company_name", e.target.value)}
              placeholder="会社名"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              value={s.name}
              onChange={(e) => updateRow(i, "name", e.target.value)}
              placeholder="氏名"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input
              type="email"
              value={s.email}
              onChange={(e) => updateRow(i, "email", e.target.value)}
              placeholder="メールアドレス"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            disabled={signers.length <= 1}
            className="mt-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium pl-8"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        署名者を追加
      </button>
    </div>
  );
}
