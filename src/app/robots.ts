import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  if (process.env.VERCEL_ENV !== "production") {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/privacy", "/contact"],
        disallow: [
          "/admin",
          "/api/",
          "/apply/",
          "/assessment",
          "/assessment-layers",
          "/dashboard",
          "/hiring/",
          "/join/",
          "/manager",
          "/observe/",
          "/onboarding",
          "/org",
          "/profile",
          "/share/",
          "/sign-in",
          "/sign-up",
          "/team",
          "/try/claim",
          "/try/complete",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
