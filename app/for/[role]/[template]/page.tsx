import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryArticle, galleryMetadata } from "@/components/gallery/GalleryArticle";
import { roleById } from "@/lib/templates/roles";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ role: string; template: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role, template } = await params;
  if (!roleById(role)) return { title: "Not found", robots: { index: false } };
  return galleryMetadata(template, role);
}

/** A design shown as a portfolio for one job, e.g. /for/project-manager/prospectus. */
export default async function RoleTemplatePage({ params }: Props) {
  const { role, template } = await params;
  if (!roleById(role)) notFound();
  return <GalleryArticle slug={template} roleId={role} />;
}
