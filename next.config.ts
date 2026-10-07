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

/** Doctors' profile photos, uploaded as WebP by `src/lib/profile-photo.ts`. */
const cloudinaryPhotos = new URL(
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME ?? "_"}/image/upload/**`,
);

const nextConfig: NextConfig = {
  allowedDevOrigins: privateNetworkHosts,
  images: { remotePatterns: [cloudinaryPhotos] },
  // libheif's WebAssembly build, for iPhone HEIC photos; loaded at run time, not bundled.
  serverExternalPackages: ["heic-convert"],
  experimental: {
    // Profile photos the browser couldn't shrink first arrive as they are (up to 9 MB, see
    // `RAW_PHOTO_LIMIT`). Kept under the proxy's own 10 MB buffer.
    serverActions: { bodySizeLimit: "10mb" },
  },
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
