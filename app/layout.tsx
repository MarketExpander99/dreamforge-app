import type { Metadata, Viewport } from "next";
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
    default: "Skill-Gain - Network-Driven Learning",
    template: "%s | Skill-Gain"
  },
  description: "Transform education with Skill-Gain - the premier learning platform featuring AI-powered personalization, interactive content, and network-driven excellence. Master any subject through engaging, discovery-based learning.",
  keywords: ["education", "learning", "skill-gain", "online learning", "AI-powered", "adaptive learning", "network learning", "personalized education"],
  authors: [{ name: "Skill-Gain Team" }],
  creator: "Skill-Gain",
  publisher: "Skill-Gain",
  formatDetection: {
    telephone: false,
  },
  metadataBase: new URL('https://skill-gain.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en',
    url: 'https://skill-gain.com',
    title: 'Skill-Gain - Network-Driven Learning',
    description: 'Transform education with Skill-Gain - the premier learning platform featuring AI-powered personalization, interactive content, and network-driven excellence.',
    siteName: 'Skill-Gain',
    images: [
      {
        url: 'https://skill-gain.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Skill-Gain - Network-Driven Learning',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Skill-Gain - Network-Driven Learning',
    description: 'Transform education with Skill-Gain - the premier learning platform featuring AI-powered personalization, interactive content, and network-driven excellence.',
    images: ['https://skill-gain.com/og-image.jpg'],
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

// Next.js 16+ App Router viewport configuration
export const generateViewport = (): Viewport => ({
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
});

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
