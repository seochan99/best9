import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Best 9 of 2025 | 2025 Best9",
  description: "Check out this Instagram Best 9 collage for 2025. Create yours now!",
  openGraph: {
    title: "Best 9 of 2025",
    description: "Check out this Instagram Best 9 collage. Create yours now!",
    type: "website",
    siteName: "2025 Best9",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best 9 of 2025",
    description: "Check out this Instagram Best 9 collage!",
  },
  robots: {
    index: false,
    follow: true,
    googleBot: {
      index: false,
      follow: true,
      noimageindex: true,
    },
  },
};

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
