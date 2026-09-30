import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV detail extractor",
  description: "Extract CV text and structure your professional details for a Formora portfolio.",
  alternates: { canonical: "/DetailExtractorPage" },
};

export default function DetailExtractorLayout({ children }: Readonly<{ children: React.ReactNode }>) { return children; }
