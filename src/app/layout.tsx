import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";

import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Doctor console | HealthMatrix",
    template: "%s | HealthMatrix doctor console",
  },
  description:
    "The HealthMatrix doctor console: patient timelines, Ekaay summaries and prescriptions, opened only with the patient’s OTP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${figtree.variable} ${bricolage.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
