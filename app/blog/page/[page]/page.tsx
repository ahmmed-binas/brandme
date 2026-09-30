import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListing from "@/components/blog/BlogListing";
import { totalArticlePages } from "@/lib/content/articles";
type Props = { params: Promise<{ page: string }> };
export function generateStaticParams() { return Array.from({ length: Math.max(0, totalArticlePages - 1) }, (_, index) => ({ page: String(index + 2) })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { page } = await params; const number = Number(page); return { title: `Journal page ${number}`, description: `Page ${number} of Formora's portfolio and document-workflow journal.`, alternates: { canonical: `/blog/page/${number}` } }; }
export default async function PaginatedBlogPage({ params }: Props) { const { page } = await params; const number = Number(page); if (!Number.isInteger(number) || number < 2 || number > totalArticlePages) notFound(); return <BlogListing page={number} />; }
