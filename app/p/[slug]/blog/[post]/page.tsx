import { BlogPost, blogPostMetadata } from "@/lib/portfolio/blog-pages";
import { sitePathFor } from "@/lib/portfolio/site";

type Props = { params: Promise<{ slug: string; post: string }> };
export const generateMetadata = async ({ params }: Props) => { const { slug, post } = await params; return blogPostMetadata(await sitePathFor(slug), post); };
export default async function Page({ params }: Props) { const { slug, post } = await params; return <BlogPost site={await sitePathFor(slug)} slug={post} />; }
