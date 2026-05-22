import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { FirestoreDataProvider } from "@/providers/FirestoreDataProvider";
import HaloAIWidget from "@/components/ai/HaloAIWidget";
import MobileBottomNav from "@/components/layout/MobileBottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.portalkorwil.online"),
  title: "Portal Pendidikan Kecamatan Lemahabang - Dinas Pendidikan Kabupaten Cirebon",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/portalnew.png",
    apple: "/portalnew.png",
  },
  description:
    "Portal resmi pendidikan Kecamatan Lemahabang, Tim Kerja Kecamatan Lemahabang, Dinas Pendidikan Kabupaten Cirebon. Media informasi dan komunikasi stakeholder pendidikan.",
  keywords: [
    "pendidikan",
    "lemahabang",
    "cirebon",
    "kecamatan",
    "dinas pendidikan",
    "tim kerja kecamatan",
    "SD",
    "TK",
    "PAUD",
    "portal pendidikan",
  ],
  authors: [
    { name: "Tim Kerja Kecamatan Lemahabang" },
  ],
  openGraph: {
    title: "Portal Pendidikan Kecamatan Lemahabang",
    description:
      "Portal resmi pendidikan Kecamatan Lemahabang, Dinas Pendidikan Kabupaten Cirebon",
    url: "https://www.portalkorwil.online",
    siteName: "Portal Pendidikan Kecamatan Lemahabang",
    images: [
      {
        url: "/portalnew.png",
        width: 1200,
        height: 630,
        alt: "Portal Pendidikan Kecamatan Lemahabang",
      },
    ],
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "Portal Pendidikan Kecamatan Lemahabang",
    description:
      "Portal resmi pendidikan Kecamatan Lemahabang, Dinas Pendidikan Kabupaten Cirebon",
    images: ["/portalnew.png"],
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
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            <FirestoreDataProvider>
              {children}
            </FirestoreDataProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                duration: 3000,
              }}
            />
            <HaloAIWidget />
            <MobileBottomNav />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
