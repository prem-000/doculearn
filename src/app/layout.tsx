import localFont from "next/font/local";
import "./globals.css";

import { Navbar } from "@/components/Navbar";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "DocuLearn AI | Don't just read. Understand.",
  description: "Privacy-first, AI-powered document learning platform with non-linear Doubt Graphs.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DocuLearn",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
};

import { DeviceProvider } from "@/components/providers/device-provider";
import { Toaster } from "react-hot-toast";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWARegister } from "@/components/PWARegister";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6366f1" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
          });
        `}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWARegister />
        <DeviceProvider>
          <Navbar />
          <PWAInstallPrompt />
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#18181b",
                color: "#fff",
                border: "1px solid #27272a",
              },
            }}
          />
        </DeviceProvider>
      </body>
    </html>
  );
}
