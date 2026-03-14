"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ContractAlerts, ContractTimeline } from "./ContractAlerts";

interface MonthlyData {
  label: string;
  sent: number;
  completed: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

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

interface DashboardStats {
  monthly: MonthlyData[];
  statusBreakdown: StatusData[];
  categoryBreakdown: { name: string; value: number }[];
  contractAlerts?: ContractAlert[];
  contractTimeline?: ContractTimelineItem[];
  totals: {
    total: number;
    thisMonth: number;
    draft: number;
    sent: number;
    completed: number;
  };
}

export function DashboardCharts() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64 animate-pulse bg-gray-50" />
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-64 animate-pulse bg-gray-50" />
      </div>
    );
  }

  if (!stats) return null;

  const hasChartData = stats.monthly.some((m) => m.sent > 0 || m.completed > 0);

  return (
    <>
      {/* Contract Alerts */}
      {stats.contractAlerts && stats.contractAlerts.length > 0 && (
        <ContractAlerts alerts={stats.contractAlerts} />
      )}

      {/* Charts */}
      {hasChartData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Monthly Bar Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" className="w-4 h-4">
                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              月別推移（過去6ヶ月）
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats.monthly} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
                <Bar dataKey="sent" name="送信" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" name="締結" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" className="w-4 h-4">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
              </svg>
              ステータス内訳
            </h3>
            {stats.statusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={{ strokeWidth: 1 }}
                  >
                    {stats.statusBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">データなし</div>
            )}
          </div>
        </div>
      )}

      {/* Contract Timeline */}
      {stats.contractTimeline && stats.contractTimeline.length > 0 && (
        <ContractTimeline items={stats.contractTimeline} />
      )}
    </>
  );
}
