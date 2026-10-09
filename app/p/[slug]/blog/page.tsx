import { BlogIndex, blogIndexMetadata, pageParam } from "@/lib/portfolio/blog-pages";
import { sitePathFor } from "@/lib/portfolio/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string | string[] }> };
export const generateMetadata = async ({ params }: Props) => blogIndexMetadata(await sitePathFor((await params).slug));
export default async function Page({ params, searchParams }: Props) { return <BlogIndex site={await sitePathFor((await params).slug)} page={pageParam((await searchParams).page)} />; }
