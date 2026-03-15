import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://musubi-sign.com";

export const metadata: Metadata = {
  title: {
    default: "MUSUBI sign | 電子契約・署名プラットフォーム",
    template: "%s | MUSUBI sign",
  },
  description: "MUSUBI sign - 契約を、結ぶ。AI契約リスク検出搭載の電子契約プラットフォーム。無料で始められます。",
  keywords: ["電子契約", "電子署名", "契約書", "PDF署名", "NDA", "業務委託", "MUSUBI sign", "AI契約分析"],
  authors: [{ name: "UNSER LLC" }],
  creator: "UNSER LLC",
  publisher: "UNSER LLC",
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: APP_URL,
    siteName: "MUSUBI sign",
    title: "MUSUBI sign | 契約を、結ぶ。",
    description: "AI契約リスク検出搭載の電子契約プラットフォーム。PDF署名・テンプレート・監査ログ。無料プランあり。",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MUSUBI sign - 契約を、結ぶ。",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MUSUBI sign | 契約を、結ぶ。",
    description: "AI契約リスク検出搭載の電子契約プラットフォーム。無料で始められます。",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        <meta name="theme-color" content="#1a365d" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MUSUBI sign",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "AI契約リスク検出搭載の電子契約・署名プラットフォーム",
              url: APP_URL,
              author: {
                "@type": "Organization",
                name: "UNSER LLC",
                url: "https://unser-inc.com",
              },
              offers: [
                {
                  "@type": "Offer",
                  name: "Free",
                  price: "0",
                  priceCurrency: "JPY",
                  description: "月5件まで送信、1ユーザー",
                },
                {
                  "@type": "Offer",
                  name: "Starter",
                  price: "2980",
                  priceCurrency: "JPY",
                  description: "月30件まで送信、AI契約リスク検出",
                },
                {
                  "@type": "Offer",
                  name: "Business",
                  price: "5000",
                  priceCurrency: "JPY",
                  description: "送信無制限、API連携、Webhook",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-gray-100 text-gray-900">
        {children}
      </body>
    </html>
  );
}
