import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/user-context";
import { NotificationProvider } from "@/lib/notification-context";
import { NotificationContainer } from "@/components/notification-container";

export const metadata: Metadata = {
  title: "Skill Gain - Learn Through Discovery",
  description: "An educational social platform where learning feels like scrolling through TikTok",
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
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
