import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListing from "@/components/blog/BlogListing";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ page: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const number = Number((await params).page);
  return { title: `Journal, page ${number}`, description: `Page ${number} of the Formora Journal: practical advice on portfolios for every kind of work.`, alternates: { canonical: `/blog/page/${number}` } };
}

export default async function PaginatedBlogPage({ params }: Props) {
  const number = Number((await params).page);
  if (!Number.isInteger(number) || number < 2) notFound();
  return <BlogListing page={number} />;
}
