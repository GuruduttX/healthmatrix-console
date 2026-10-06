import type { NextConfig } from "next";

/**
 * Lets phones and tablets on the same network open the dev server by its local address
 * (e.g. http://192.168.1.3:3000). Without this, Next blocks its own scripts for any host but
 * localhost, so pages never become interactive on a phone. Development only; ignored in production.
 */
const privateNetworkHosts = [
  "192.168.*.*",
  "10.*.*.*",
  ...Array.from({ length: 16 }, (_, i) => `172.${16 + i}.*.*`),
  "*.local",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: privateNetworkHosts,
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
