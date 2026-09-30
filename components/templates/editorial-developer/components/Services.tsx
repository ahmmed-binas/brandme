import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

// Optional section — only relevant for freelance/client-facing use. Hidden
// entirely when the services array is empty.
export default function Services() {
  const portfolioData = useEditorialData();
  const { services } = portfolioData;
  if (services.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="09" title="What I can build" />
        <div className="md:ml-10">
          {services.map((s, i) => (
            <RevealOnScroll key={s.id}>
              <div className="grid gap-4 border-t border-line py-6 md:grid-cols-[60px_1fr_1fr]">
                <span className="font-mono text-sm text-muted">0{i + 1}</span>
                <div>
                  <h3 className="font-display text-xl">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">{s.description}</p>
                </div>
                <div className="flex flex-wrap content-start gap-2 md:justify-end">
                  {s.technologies.map((t) => (
                    <span key={t} className="font-mono text-xs text-muted">{t}</span>
                  ))}
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
