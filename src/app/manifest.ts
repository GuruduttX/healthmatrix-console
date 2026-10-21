import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HealthMatrix doctor console",
    short_name: "HealthMatrix",
    description: "Patient timelines, Ekaay summaries and prescriptions, opened only with the patient’s OTP.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fbfaf8",
    theme_color: "#fbfaf8",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
