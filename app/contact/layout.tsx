import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Fuccura for portfolio and document-tool support.",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
