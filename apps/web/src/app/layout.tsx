import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import "@/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ContentFlow - AI Social Media Management",
    template: "%s | ContentFlow",
  },
  description:
    "Create, repurpose, schedule, and publish content across multiple social media platforms using AI.",
  keywords: [
    "social media management",
    "content scheduling",
    "AI content generation",
    "social media automation",
  ],
  authors: [{ name: "ContentFlow" }],
  creator: "ContentFlow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://contentflow.app",
    title: "ContentFlow - AI Social Media Management",
    description:
      "Create, repurpose, schedule, and publish content across multiple social media platforms using AI.",
    siteName: "ContentFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContentFlow - AI Social Media Management",
    description:
      "Create, repurpose, schedule, and publish content across multiple social media platforms using AI.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head />
      <body>
        <SessionProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
