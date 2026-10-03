"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import VisitBeacon from "./VisitBeacon";

export default function AppShell({ children }: { children: React.ReactNode }) {
  // The route segment (not the browser path) is used because custom domains are served via a rewrite:
  // the browser shows "/" while the route is /sites/<host>.
  const segment = useSelectedLayoutSegment();
  const isPortfolioView = segment === "templates" || segment === "editor" || segment === "p" || segment === "sites";

  // The superadmin console has its own layout and isn't counted as a visit.
  if (segment === "console") return <>{children}</>;

  if (isPortfolioView) {
    return <><VisitBeacon />{children}</>;
  }

  return (
    <>
      <VisitBeacon />
      <Header />
      <main id="main" className="pt-16">{children}</main>
      <Footer />
    </>
  );
}
