"use client";

import Link from "next/link";

interface ContractAlert {
  id: string;
  title: string;
  contract_end_date: string;
  days_remaining: number;
  level: "danger" | "warning" | "info";
}

interface ContractTimelineItem {
  id: string;
  title: string;
  contract_start_date: string | null;
  contract_end_date: string;
  days_remaining: number;
}

export function ContractAlerts({ alerts }: { alerts: ContractAlert[] }) {
  if (!alerts.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">契約期限アラート</h3>
          <p className="text-[11px] text-gray-500">{alerts.length}件の契約が期限間近です</p>
        </div>
      </div>
      <div className="divide-y divide-gray-50">
        {alerts.slice(0, 5).map((alert) => (
          <Link
            key={alert.id}
            href={`/documents/${alert.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              alert.level === "danger" ? "bg-red-500 animate-pulse" :
              alert.level === "warning" ? "bg-amber-500" : "bg-blue-500"
            }`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{alert.title}</p>
              <p className="text-xs text-gray-500">
                期限: {new Date(alert.contract_end_date).toLocaleDateString("ja-JP")}
              </p>
            </div>
            <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
              alert.level === "danger" ? "bg-red-100 text-red-700" :
              alert.level === "warning" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            }`}>
              {alert.days_remaining <= 0
                ? `${Math.abs(alert.days_remaining)}日超過`
                : `残り${alert.days_remaining}日`}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ContractTimeline({ items }: { items: ContractTimelineItem[] }) {
  if (!items.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-6">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">契約期間タイムライン</h3>
          <p className="text-[11px] text-gray-500">契約終了日順に表示</p>
        </div>
      </div>
      <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
        {items.map((item) => {
          const endDate = new Date(item.contract_end_date);
          const isExpired = item.days_remaining <= 0;
          const isNear = item.days_remaining > 0 && item.days_remaining <= 30;
          const progress = item.contract_start_date
            ? Math.min(100, Math.max(0,
                ((Date.now() - new Date(item.contract_start_date).getTime()) /
                  (endDate.getTime() - new Date(item.contract_start_date).getTime())) * 100
              ))
            : 50;

          return (
            <Link
              key={item.id}
              href={`/documents/${item.id}`}
              className="block rounded-lg border border-gray-100 p-3 hover:border-gray-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800 truncate flex-1 mr-2">{item.title}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isExpired ? "bg-red-100 text-red-700" :
                  isNear ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                }`}>
                  {isExpired ? "期限切れ" : isNear ? `残${item.days_remaining}日` : `残${item.days_remaining}日`}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
                {item.contract_start_date && (
                  <span>{new Date(item.contract_start_date).toLocaleDateString("ja-JP")}</span>
                )}
                <span>→</span>
                <span>{endDate.toLocaleDateString("ja-JP")}</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isExpired ? "bg-red-500" : isNear ? "bg-amber-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
