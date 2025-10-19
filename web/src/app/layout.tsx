import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ReduxProvider } from "@/components/providers/redux-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CarNance - Smart Car Financing Insights",
  description: "Make informed car financing decisions with personalized insights and projections",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ReduxProvider>
          <ThemeProvider>
            <div className="relative min-h-dvh">
              <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-black/60 to-transparent px-6 py-3 text-white backdrop-blur">
                <div className="mx-auto flex max-w-5xl items-center justify-end">
                  <ThemeToggle />
                </div>
              </header>
              {children}
            </div>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
