import RevealOnScroll from "./RevealOnScroll";

// Structural device: the index number is only meaningful because sections
// genuinely are a sequence on this page — not decoration.
export default function SectionHeading({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description?: string;
}) {
  return (
    <RevealOnScroll className="mb-12 md:mb-16">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-sm text-accent">{index}</span>
        <h2 className="font-display text-3xl md:text-5xl font-medium tracking-tight text-balance">
          {title}
        </h2>
      </div>
      {description && (
        <p className="mt-4 max-w-xl text-muted leading-relaxed md:ml-10">{description}</p>
      )}
    </RevealOnScroll>
  );
}
