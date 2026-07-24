import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/common/Header";
import ThemeProvider from "@/components/common/ThemeProvider";

export const metadata: Metadata = {
  title: "CV Gen",
  description: "Create professional portfolios with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Header />

          <main className="pt-16">
            {children}
          </main>
        </ThemeProvider>

      </body>
    </html>
  );
}