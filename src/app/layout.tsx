import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@/components/providers/query-provider";
import { SessionProvider } from "@/components/providers/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AliArts - Unleash Your Creative Potential",
  description: "Discover courses, artworks, and a vibrant creative community at AliArts. Learn, create, and share your artistic journey.",
  keywords: ["AliArts", "art", "courses", "creative", "artworks", "community", "learn art"],
  authors: [{ name: "AliArts" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "AliArts - Unleash Your Creative Potential",
    description: "Discover courses, artworks, and a vibrant creative community",
    siteName: "AliArts",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <QueryClientProvider>
              {children}
              <Toaster />
            </QueryClientProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
