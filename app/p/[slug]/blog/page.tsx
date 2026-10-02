import { BlogIndex, blogIndexMetadata } from "@/lib/portfolio/blog-pages";
import { sitePathFor } from "@/lib/portfolio/site";

type Props = { params: Promise<{ slug: string }> };
export const generateMetadata = async ({ params }: Props) => blogIndexMetadata(await sitePathFor((await params).slug));
export default async function Page({ params }: Props) { return <BlogIndex site={await sitePathFor((await params).slug)} />; }
