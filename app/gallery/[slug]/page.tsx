import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { GalleryArticle, articlePath, galleryMetadata } from "@/components/gallery/GalleryArticle";
import { roleById } from "@/lib/templates/roles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ role?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return galleryMetadata((await params).slug);
}

/** /gallery/<template>. A job chosen the old way (?role=<job>) moves to /for/<job>/<template>. */
export default async function GalleryArticlePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const role = roleById((await searchParams).role);
  if (role) permanentRedirect(articlePath(slug, role.id));
  return <GalleryArticle slug={slug} />;
}
