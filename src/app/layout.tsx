import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";

// Initialize the Geist font with Latin subset
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Initialize the Geist Mono font with Latin subset
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Define metadata for better SEO
export const metadata: Metadata = {
  title: "Hourly Checklist",
  description: "Build habits by completing tasks every hour. Your checklist resets automatically.",
  keywords: ["Productivity", "Habits", "Checklist", "Time Management", "Task Tracking"],
  authors: [{ name: "Created with Cursor Agent" }],
  creator: "Cursor Agent",
  publisher: "Cursor Agent",
  openGraph: {
    title: "Hourly Checklist",
    description: "Build habits by completing tasks every hour. Your checklist resets automatically.",
    url: "https://hourly-checklist.vercel.app/",
    siteName: "Hourly Checklist",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hourly Checklist",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hourly Checklist",
    description: "Build habits by completing tasks every hour. Your checklist resets automatically.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
