import { BlogPost, blogPostMetadata } from "@/lib/portfolio/blog-pages";
import { siteForHost } from "@/lib/portfolio/site";

type Props = { params: Promise<{ host: string; post: string }> };
export const generateMetadata = async ({ params }: Props) => { const { host, post } = await params; return blogPostMetadata(await siteForHost(host), post); };
export default async function Page({ params }: Props) { const { host, post } = await params; return <BlogPost site={await siteForHost(host)} slug={post} />; }
