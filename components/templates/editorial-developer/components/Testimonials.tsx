import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

// Optional section. Never populate this with fabricated quotes — the
// section disappears automatically until real ones exist.
export default function Testimonials() {
  const portfolioData = useEditorialData();
  const { testimonials } = portfolioData;
  if (testimonials.length === 0) return null;

  return (
    <section className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="10" title="What people say" />
        <div className="md:ml-10 grid gap-8 md:grid-cols-2">
          {testimonials.map((t) => (
            <RevealOnScroll key={t.id}>
              <blockquote className="border-t border-line pt-6">
                <p className="text-lg leading-relaxed text-text">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-4 font-mono text-xs text-muted">
                  {t.person} — {t.role}, {t.company}
                </footer>
              </blockquote>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
