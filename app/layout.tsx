import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/common/AppShell";
import ThemeProvider from "@/components/common/ThemeProvider";
import AuthProvider from "@/components/common/AuthProvider";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL("https://formora.example"),
  title: { default: "Formora | Portfolios and document tools", template: "%s | Formora" },
  description: "Create polished portfolios and use privacy-first document tools that work in your browser.",
  keywords: ["portfolio builder", "PDF to image", "PDF text extractor", "free document tools", "CV portfolio"],
  openGraph: { type: "website", siteName: "Formora", title: "Formora | Portfolios and document tools", description: "Polished portfolios and privacy-first document tools." },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", name: brand.name, url: "https://formora.example", email: brand.contactEmail }, { "@type": "WebSite", name: brand.name, url: "https://formora.example", description: brand.description }] }) }}
          />
          <AuthProvider><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></AuthProvider>
      </body>
    </html>
  );
}
