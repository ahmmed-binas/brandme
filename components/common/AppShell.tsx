"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPortfolioView = pathname === "/templates" || pathname.startsWith("/templates/") || pathname.startsWith("/editor/");

  if (isPortfolioView) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="pt-[4.5rem]">{children}</main>
      <Footer />
    </>
  );
}
