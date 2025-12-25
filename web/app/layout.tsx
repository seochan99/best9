import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Best 9 of 2025 - Your Year in Photos",
  description: "Create your Instagram Best 9 collage for 2025. Free, fast, and beautiful.",
  openGraph: {
    title: "Best 9 of 2025 - Your Year in Photos",
    description: "Create your Instagram Best 9 collage for 2025. Free, fast, and beautiful.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
