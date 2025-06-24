import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { ErrorBoundary, ToastProvider, QueryProvider } from "@/components/providers";
import { AuthProvider } from "@/hooks/useAuth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://n8n-automated.com'),
  title: {
    default: "Autokraft",
    template: "%s | Autokraft",
  },
  description: "Generate, customize, and optimize n8n workflows with the power of AI. Streamline your automation, save time, and build complex integrations effortlessly.",
  applicationName: "N8N AI Workflow Generator",
  keywords: [
    "n8n",
    "AI workflow generator",
    "automation",
    "workflow automation",
    "AI tools",
    "integrations",
    "productivity",
    "nocode",
    "lowcode",
  ],
  authors: [{
    name: "Autokraft",
    url: "https://n8n-automated.com"
  }],
  creator: "Autokraft",
  publisher: "Autokraft",
  openGraph: {
    title: "N8N AI Workflow Generator - Automate with Intelligence",
    description: "Generate, customize, and optimize n8n workflows with the power of AI. Streamline your automation, save time, and build complex integrations effortlessly.",
    url: "https://n8n-automated.com",
    siteName: "N8N AI Workflow Generator",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "N8N AI Workflow Generator Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "N8N AI Workflow Generator - Automate with Intelligence",
    description: "Generate, customize, and optimize n8n workflows with the power of AI. Streamline your automation, save time, and build complex integrations effortlessly.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <QueryProvider>
            <AuthProvider>
              <ToastProvider>
                {children}
                <Toaster 
                  position="top-right"
                  closeButton
                  richColors
                  theme="dark"
                />
              </ToastProvider>
            </AuthProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
