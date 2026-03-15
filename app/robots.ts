import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://musubi-sign.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/documents/", "/settings/", "/templates/", "/sign/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
