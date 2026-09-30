import { ExternalLink } from "lucide-react";
import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

// Optional section — hidden entirely when there's nothing real to show.
export default function Certifications() {
  const portfolioData = useEditorialData();
  const { certifications } = portfolioData;
  if (certifications.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="07" title="Certifications" />
        <div className="md:ml-10 grid gap-4 sm:grid-cols-2">
          {certifications.map((c) => (
            <RevealOnScroll key={c.id}>
              <div className="border border-line p-5">
                <p className="font-display text-lg">{c.name}</p>
                <p className="mt-1 font-mono text-xs text-muted">{c.organization} · {c.date}</p>
                {c.credentialUrl && (
                  <a href={c.credentialUrl} className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-accent underline-hover">
                    View credential <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
