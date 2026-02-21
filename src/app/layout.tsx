import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "sonner";
import { NotificationProvider } from "@/components/notifications/NotificationProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WorldVisa DMS",
  description: "Document Management System for WorldVisa",
  icons: {
    icon: [
      { url: "/favicon.ico?v=1", sizes: "any" },
      { url: "/favicon.ico?v=1", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico?v=1",
    apple: "/favicon.ico?v=1",
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
        <link rel="icon" href="/favicon.ico?v=1" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico?v=1" />
        <link rel="apple-touch-icon" href="/favicon.ico?v=1" />
        <meta name="msapplication-TileImage" content="/favicon.ico?v=1" />
      </head>
      <body
        className={`${outfit.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <NotificationProvider>{children}</NotificationProvider>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
