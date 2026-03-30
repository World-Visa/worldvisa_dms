import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/sonner";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SmoothScroll } from "@/components/SmoothScroll";
import { ClarityAnalytics } from "@/components/ClarityAnalytics";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkTokenProvider } from "@/components/auth/ClerkTokenProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorldVisa DMS",
  description: "Document Management System for WorldVisa",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icons/icon-192x192.png" type="image/png" />
        <link rel="icon" href="/icons/icon-512x512.png" type="image/png" />
        <link rel="shortcut icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="msapplication-TileImage" content="/icons/icon-512x512.png" />
      </head>
      <body
        className={`${outfit.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ClerkProvider>
        <ClerkTokenProvider />
        <SmoothScroll>
          <Providers>
            <NotificationProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </NotificationProvider>
            <Toaster />
          </Providers>
          <ClarityAnalytics />
        </SmoothScroll>
        </ClerkProvider>
      </body>
    </html>
  );
}
