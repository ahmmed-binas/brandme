"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // The route segment (not the browser path) is used because custom domains are served via a rewrite:
  // the browser shows "/" while the route is /sites/<host>.
  const segment = useSelectedLayoutSegment();
  const isPortfolioView = segment === "templates" || segment === "editor" || segment === "p" || segment === "sites";

  if (isPortfolioView) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main id="main" className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
