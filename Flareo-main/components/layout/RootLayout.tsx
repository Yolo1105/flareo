import type { Metadata } from "next";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProviderWrapper } from "@/components/theme/theme-provider-wrapper";
import { Footer } from "./Footer";
import Header from "./Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Flareo",
  description: "Flareo - Your AI Plugin Marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" style={{ colorScheme: "light" }}>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css" rel="stylesheet" />
      </head>
      <body className={inter.className}>
        <ThemeProviderWrapper>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-grow pt-8">
              {children}
            </main>
            <div className="mt-8">
              <Footer />
            </div>
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
} 