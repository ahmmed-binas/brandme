import type { Metadata } from "next";
import BlogListing from "@/components/blog/BlogListing";

export const metadata: Metadata = {
  title: "Journal",
  description: "Practical portfolio, career, design, and document-workflow advice from Formora.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return <BlogListing page={1} />;
}
