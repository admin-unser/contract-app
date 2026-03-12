import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNSER Sign | 電子契約・署名管理",
  description: "電子契約・署名管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
