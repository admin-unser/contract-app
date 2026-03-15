import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MUSUBI sign | 電子契約・署名プラットフォーム",
  description: "MUSUBI sign - 契約を、結ぶ。電子契約・署名プラットフォーム",
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
