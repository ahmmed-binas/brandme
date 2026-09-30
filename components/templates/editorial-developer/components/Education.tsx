import { useEditorialData } from "../EditorialDataContext";
import SectionHeading from "./SectionHeading";
import RevealOnScroll from "./RevealOnScroll";

export default function Education() {
  const portfolioData = useEditorialData();
  const { education } = portfolioData;
  if (education.length === 0) return null;

  return (
    <section id="education" className="border-b border-line px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <SectionHeading index="06" title="Education" />

        <div className="md:ml-10 space-y-8">
          {education.map((ed) => (
            <RevealOnScroll key={ed.id}>
              <div className="grid gap-2 border-t border-line pt-6 md:grid-cols-[1fr_auto]">
                <div>
                  <h3 className="font-display text-xl font-medium">
                    {ed.degree}, {ed.field}
                  </h3>
                  <p className="mt-1 font-mono text-sm text-muted">
                    {ed.institution} · {ed.location}
                  </p>
                </div>
                <p className="font-mono text-xs text-muted md:text-right">
                  {ed.startDate} — {ed.endDate}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
