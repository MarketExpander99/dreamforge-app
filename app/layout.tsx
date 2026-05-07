import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/user-context";
import { NotificationProvider } from "@/lib/notification-context";
import { NotificationContainer } from "@/components/notification-container";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ServiceWorkerProvider } from "@/components/service-worker-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    default: "Skill Gain - Learn Through Discovery",
    template: "%s | Skill Gain"
  },
  description: "Transform education with Skill Gain - an interactive learning platform featuring adaptive CAPS curriculum, gamification, and social learning. Join thousands of South African students mastering Mathematics, Sciences, and more through engaging, discovery-based learning.",
  keywords: ["education", "learning", "CAPS curriculum", "South Africa", "Mathematics", "Science", "online learning", "gamification", "adaptive learning"],
  authors: [{ name: "Skill Gain Team" }],
  creator: "Skill Gain",
  publisher: "Skill Gain",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL('https://skillgain.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://skillgain.app',
    title: 'Skill Gain - Learn Through Discovery',
    description: 'Transform education with Skill Gain - an interactive learning platform featuring adaptive CAPS curriculum, gamification, and social learning.',
    siteName: 'Skill Gain',
    images: [
      {
        url: 'https://skillgain.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Skill Gain - Learn Through Discovery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill Gain - Learn Through Discovery',
    description: 'Transform education with Skill Gain - an interactive learning platform featuring adaptive CAPS curriculum, gamification, and social learning.',
    images: ['https://skillgain.app/og-image.jpg'],
    creator: '@skillgainapp',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Skill Gain",
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
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                });
              `}
            </Script>
          </>
        )}

        {/* Vercel Analytics */}
        <Script
          src="https://vercel.com/vitals"
          strategy="afterInteractive"
        />

        <ErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              {children}
              <NotificationContainer />
              <InstallPrompt />
              <OfflineIndicator />
              <ServiceWorkerProvider />
            </NotificationProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
