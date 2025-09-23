import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "sonner";
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { NotificationDebugger } from '@/components/notifications/NotificationDebugger';
import { NotificationTestButton } from '@/components/notifications/NotificationTestButton';
import { LocalNotificationTestButton } from '@/components/notifications/LocalNotificationTestButton';

const geistSans = Geist({
  variable: "--font-geist-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  variable: "--font-lexend",
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
      { url: "/favicon.ico?v=1", type: "image/x-icon" }
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
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Providers>
          <NotificationProvider>
          {children}
        </NotificationProvider>
        <NotificationDebugger />
        <NotificationTestButton />
        <LocalNotificationTestButton />
        <Toaster />
      </Providers>
    </body>
    </html >
  );
}
