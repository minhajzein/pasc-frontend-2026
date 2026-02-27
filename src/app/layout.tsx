import type { Metadata, Viewport } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "PASC | Pandikkadavu Arts and Sports Club & PASFIESTA",
  description: "Pandikkadavu Arts and Sports Club — PASFIESTA: PPL, PCL, PVL, PBL.",
  icons: {
    icon: "/pasc-logo.png",
    apple: "/pasc-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">
        <QueryProvider>
          <LocaleProvider>
            <Header />
            <main className="min-w-0 flex-1 pt-14 sm:pt-16">{children}</main>
            <Footer />
          </LocaleProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
