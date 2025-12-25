import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "Insta Best 9 2025 - Your Top 9 Instagram Posts",
  description: "Create your Instagram Best 9 collage for 2025. See your most liked posts of the year in a beautiful 3x3 grid. Free and instant.",
  keywords: ["instagram", "best 9", "best nine", "2025", "top 9", "collage", "year in review", "instagram recap"],
  authors: [{ name: "seochan", url: "https://www.instagram.com/dev_seochan/" }],
  creator: "seochan",
  openGraph: {
    title: "Insta Best 9 2025 - Your Top 9 Instagram Posts",
    description: "Create your Instagram Best 9 collage for 2025. See your most liked posts of the year in a beautiful 3x3 grid.",
    type: "website",
    locale: "en_US",
    siteName: "Insta Best 9",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insta Best 9 2025",
    description: "Create your Instagram Best 9 collage for 2025. Free and instant.",
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
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
      </body>
    </html>
  );
}
