import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio templates",
  description: "Browse responsive portfolio templates for creative, professional, and developer careers.",
  alternates: { canonical: "/templatechooser" },
};

export default function TemplateChooserLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
