"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { OnboardingTutorial } from "./OnboardingTutorial";
import { useEffect } from "react";

interface DashboardShellProps {
  email: string;
  statusCounts: {
    draft: number;
    sent: number;
    completed: number;
  };
  children: React.ReactNode;
}

export function DashboardShell({ email, statusCounts, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header email={email} onMenuToggle={() => setSidebarOpen((v) => !v)} />
      <div className="flex flex-1">
        <Sidebar
          statusCounts={statusCounts}
          mobileOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 md:ml-[var(--sidebar-width)] mt-[var(--header-height)] p-4 md:p-6">
          {children}
        </main>
      </div>
      <OnboardingTutorial />
    </div>
  );
}
