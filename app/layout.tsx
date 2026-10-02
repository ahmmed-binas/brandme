import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/common/AppShell";
import ThemeProvider from "@/components/common/ThemeProvider";
import AuthProvider from "@/components/common/AuthProvider";
import { brand } from "@/lib/brand";
import { organizationJsonLd, siteDescription, siteUrl } from "@/lib/site";
import { display, mono, sans } from "./fonts";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: `${brand.name} — Portfolios at your own address`, template: `%s · ${brand.name}` },
  description: siteDescription,
  applicationName: brand.name,
  keywords: ["portfolio builder", "portfolio website", "developer portfolio", "CV to portfolio", "personal website", "custom domain portfolio", "LinkedIn to portfolio", "GitHub portfolio"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: brand.name, url: "/", title: `${brand.name} — Portfolios at your own address`, description: siteDescription, locale: "en_GB" },
  twitter: { card: "summary_large_image", title: `${brand.name} — Portfolios at your own address`, description: siteDescription },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f4f0e8" }, { media: "(prefers-color-scheme: dark)", color: "#13120f" }],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [organizationJsonLd, { "@type": "WebSite", name: brand.name, url: siteUrl, description: siteDescription }] }) }} />
        <AuthProvider><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></AuthProvider>
      </body>
    </html>
  );
}
