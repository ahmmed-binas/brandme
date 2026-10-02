import { BlogIndex, blogIndexMetadata } from "@/lib/portfolio/blog-pages";
import { siteForHost } from "@/lib/portfolio/site";

/** /blog on a customer's own domain (reached via the rewrite in proxy.ts). */
type Props = { params: Promise<{ host: string }> };
export const generateMetadata = async ({ params }: Props) => blogIndexMetadata(await siteForHost((await params).host));
export default async function Page({ params }: Props) { return <BlogIndex site={await siteForHost((await params).host)} />; }
