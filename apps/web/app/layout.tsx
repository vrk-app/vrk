import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/shared/ui";
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
  title: "VRK",
  description: "Рабочий веб-интерфейс VRK для сервисных операций",
  icons: {
    icon: [
      { url: "/brand/app-icons/vrk-web-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/app-icons/vrk-web-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/app-icons/vrk-web-180.png", sizes: "180x180", type: "image/png" }],
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
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
