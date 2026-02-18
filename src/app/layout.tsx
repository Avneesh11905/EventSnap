import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SessionProvider from "@/components/providers/SessionProvider";
import { UploadProvider } from "@/components/providers/UploadProvider";
import LayoutShell from "@/components/custom/LayoutShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EventSnap — Your Event Photos. Found Instantly.",
  description:
    "Stop scrolling through hundreds of event photos to find yourself. Upload one photo and let EventSnap do the work.",
  keywords: ["event photos", "face recognition", "AI photo matching", "event management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionProvider>
            <UploadProvider>
              <div className="relative z-10 flex flex-col min-h-screen">
                <LayoutShell>{children}</LayoutShell>
              </div>
            </UploadProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
