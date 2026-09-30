import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Code2 } from "lucide-react";
import { portfolioData } from "@/components/templates/editorial-developer/data";

export function generateStaticParams() { return portfolioData.projects.map((project) => ({ slug: project.slug })); }

const sections = ["description", "problem", "approach", "architecture", "challenges", "results"] as const;

export default async function EditorialProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = portfolioData.projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const placeholder = (value?: string) => !value || value.startsWith("[ADD");
  return <main className="editorial-developer min-h-screen px-6 py-24 md:px-10"><div className="mx-auto max-w-[1200px]"><Link href="/templates/editorial-developer#projects" className="inline-flex items-center gap-2 font-mono text-xs text-muted"><ArrowLeft size={14} /> All projects</Link><header className="mt-8 border-b border-line pb-10"><p className="font-mono text-xs text-muted">{project.date} · {project.role}</p><h1 className="mt-3 text-5xl font-medium tracking-tight md:text-7xl">{project.name}</h1><p className="mt-4 max-w-2xl text-lg text-muted">{project.tagline}</p></header><div className="mt-12 grid gap-12 md:grid-cols-[1fr_280px]"><div className="space-y-10">{sections.map((key) => project[key] ? <section key={key} className="border-t border-line pt-6"><h2 className="text-2xl font-medium capitalize">{key}</h2><p className={`mt-3 leading-7 ${placeholder(project[key]) ? "text-muted italic" : "text-text"}`}>{project[key]}</p></section> : null)}</div><aside className="h-fit border border-line p-5"><p className="font-mono text-xs text-muted">Technologies</p><div className="mt-4 flex flex-wrap gap-2">{project.technologies.map((technology) => <span key={technology} className="border border-line px-2 py-1 font-mono text-xs">{technology}</span>)}</div><div className="mt-6 space-y-3">{!placeholder(project.github) && <a href={project.github} className="flex items-center gap-2 text-accent"><Code2 size={15} /> Source</a>}{!placeholder(project.liveUrl) && <a href={project.liveUrl} className="flex items-center gap-2 text-accent"><ExternalLink size={15} /> Live site</a>}</div></aside></div></div></main>;
}
