import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "契約書締結アプリ",
  description: "DocuSign風の電子契約MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen bg-zinc-50 text-zinc-900">
        {children}
      </body>
    </html>
  );
}
