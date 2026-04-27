import type { Metadata } from "next";
import { Archivo_Black, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { appBaseUrl } from "@/lib/config/env";
import { auth } from "@/lib/auth/config";
import { SessionRoot } from "@/components/providers/SessionRoot";
import { PlausibleScript } from "@/components/analytics/PlausibleScript";
import "./globals.css";

/*
 * Fonts are loaded via next/font so they're self-hosted, preloaded, and
 * subsetted automatically. Each gets a CSS variable so our Tailwind @theme
 * in globals.css can reference them as fallbacks behind PP Neue Machina.
 */
const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--next-font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--next-font-body",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--next-font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appBaseUrl()),
  title: {
    default: "Flareo · Container supply chain",
    template: "%s · Flareo",
  },
  description:
    "Development-as-Product, Delivery-as-Service. Verified containers, previewed live, deployed on your own infrastructure.",
  keywords: [
    "container",
    "supply chain",
    "SBOM",
    "SLSA",
    "cosign",
    "Sigstore",
    "self-hosted",
    "verification",
    "CycloneDX",
    "Trivy",
  ],
  authors: [{ name: "Flareo" }],
  openGraph: {
    title: "Flareo · Container supply chain",
    description:
      "Verified containers, previewed live, deployed on your own infrastructure.",
    siteName: "Flareo",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flareo · Container supply chain",
    description:
      "Verified containers, previewed live, deployed on your own infrastructure.",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-canvas text-ink font-body antialiased">
        <SessionRoot session={session}>{children}</SessionRoot>
        <PlausibleScript />
      </body>
    </html>
  );
}
