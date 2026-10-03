import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const emergencyHeaders = [
      { key: "Cache-Control", value: "no-store" },
      { key: "X-Robots-Tag", value: "noindex, nofollow" },
      { key: "Referrer-Policy", value: "no-referrer" },
    ];
    return [
      // Public emergency QR page and photo: never cached, indexed or leaked through a referrer.
      { source: "/e/:path*", headers: emergencyHeaders },
    ];
  },
};

export default nextConfig;
