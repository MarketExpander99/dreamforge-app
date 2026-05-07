import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/user-context";
import { NotificationProvider } from "@/lib/notification-context";
import { NotificationContainer } from "@/components/notification-container";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerProvider } from "@/components/service-worker-provider";

export const metadata: Metadata = {
  title: "Skill Gain - Learn Through Discovery",
  description: "An educational social platform where learning feels like scrolling through TikTok",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skill Gain",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Skill Gain",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased dark"
    >
      <body className="min-h-full flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer />
            <InstallPrompt />
            <OfflineIndicator />
            <ServiceWorkerProvider />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
