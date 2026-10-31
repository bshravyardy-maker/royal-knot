import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

const cormorantGaramond = localFont({
  src: [
    {
      path: "../fonts/CormorantGaramond-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/CormorantGaramond-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = localFont({
  src: [
    {
      path: "../fonts/Manrope-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/Manrope-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/Manrope-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/Manrope-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "THE ROYAL KNOT | Luxury Wedding Agency Management",
  description:
    "Palatial wedding operations and concierge management platform for Jaipur & Udaipur.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${cormorantGaramond.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans bg-ivory text-navy antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
