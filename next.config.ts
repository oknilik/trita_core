import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["iridaceous-rickie-overloath.ngrok-free.dev"],

  // HTTP headers for resource hints (preconnect, dns-prefetch)
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
        ],
      },
    ];
  },
};

export default nextConfig;
