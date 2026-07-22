import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["iridaceous-rickie-overloath.ngrok-free.dev", "192.168.173.183"],

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "doodleipsum.com" },
    ],
  },

  // HTTP headers: resource hints + biztonsági alapkészlet.
  // CSP szándékosan nincs még — először report-only módban kell bevezetni
  // (Clerk + inline stílusok miatt), külön körben.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: [
              // Preconnect to Clerk for faster auth script loading
              '<https://perfect-elf-67.clerk.accounts.dev>; rel=preconnect; crossorigin',
              '<https://perfect-elf-67.clerk.accounts.dev>; rel=dns-prefetch',
            ].join(", "),
          },
          // Clickjacking-védelem — a felület nem ágyazódik be sehova
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // HSTS — http-n a böngésző ignorálja, prod https-en él
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
