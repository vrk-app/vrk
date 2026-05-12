import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "VRK Field Scaffold",
  description: "PWA-first field engineer scaffold for the Stage 02 platform baseline",
  icons: {
    icon: [
      { url: "/brand/app-icons/vrk-field-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/app-icons/vrk-field-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/app-icons/vrk-field-180.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <a
          href="#field-main"
          className="sr-only absolute left-4 top-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:z-50"
        >
          Перейти к основному контенту
        </a>
        {children}
      </body>
    </html>
  );
}
