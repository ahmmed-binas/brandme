import { Code2 as Github } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

// Optional section. Architected to consume live GitHub API data later —
// swap `repositories` for a fetch() result with the same shape and this
// component needs no changes. Hidden while repositories is empty so no
// contribution numbers are ever fabricated.
export default function OpenSource() {
  const portfolioData = useEditorialData();
  const { openSource } = portfolioData;
  if (openSource.repositories.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="08" title="Open source" />
        <div className="md:ml-10 grid gap-4 sm:grid-cols-2">
          {openSource.repositories.map((repo) => (
            <RevealOnScroll key={repo.name}>
              <a
                href={repo.url}
                data-cursor="external"
                className="block border border-line p-5 transition-colors hover:border-accent"
              >
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg">{repo.name}</p>
                  <Github size={16} className="text-muted" />
                </div>
                <p className="mt-2 text-sm text-muted">{repo.description}</p>
                <p className="mt-3 font-mono text-xs text-muted">{repo.language}</p>
              </a>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
