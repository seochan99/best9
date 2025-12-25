import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const SITE_URL = "https://2025best9.vercel.app";
const SITE_NAME = "2025 Best9";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "2025 Best9 - Your Top 9 Instagram Posts",
  description: "Create your Instagram Best 9 collage for 2025. See your most liked posts in a beautiful 3x3 grid. Free and instant.",
  applicationName: SITE_NAME,
  keywords: ["instagram", "best 9", "best nine", "2025", "top 9", "collage", "year in review", "instagram recap"],
  authors: [{ name: "seochan", url: "https://www.instagram.com/dev_seochan/" }],
  creator: "seochan",
  category: "social",
  alternates: {
    canonical: SITE_URL,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    apple: [
      { url: "/apple-icon-180x180.png", type: "image/png", sizes: "180x180" },
    ],
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-config": "/browserconfig.xml",
  },
  openGraph: {
    title: "2025 Best9 - Your Top 9 Instagram Posts",
    description: "Create your Instagram Best 9 collage for 2025. See your most liked posts in a beautiful 3x3 grid.",
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    url: SITE_URL,
    images: [{ url: "/opengraph-image" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "2025 Best9",
    description: "Create your Instagram Best 9 collage for 2025. Free and instant.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "WebApplication",
        name: SITE_NAME,
        url: SITE_URL,
        applicationCategory: "PhotographyApplication",
        operatingSystem: "Web",
        description: "Create your Instagram Best 9 collage for 2025.",
        isAccessibleForFree: true,
        creator: {
          "@type": "Person",
          name: "seochan",
          url: "https://www.instagram.com/dev_seochan/",
        },
      },
    ],
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
