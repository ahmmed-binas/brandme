import type { Metadata } from "next";
import BlogListing from "@/components/blog/BlogListing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Journal",
  description: "Practical advice on portfolios for every kind of work: writing an introduction, case studies, choosing a design, career changes and getting your own domain.",
  alternates: { canonical: "/blog", types: { "application/rss+xml": "/blog/rss.xml" } },
};

export default function BlogPage() {
  return <BlogListing page={1} />;
}
