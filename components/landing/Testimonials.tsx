import { Star } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { getTemplate } from "@/lib/templates/catalog";
import type { PublicFeedback } from "@/lib/templates/feedback";

/**
 * “What people say”: real notes from the editor's rating card, each with the
 * person's name and profile photo. Only notes the person agreed to share and
 * the owner chose (console > Feedback) are passed in. Hidden when there are none.
 */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- their account photo, from their sign-in provider
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        className="size-12 shrink-0 rounded-full object-cover shadow-[0_0_0_3px_var(--color-paper),0_0_0_4px_var(--color-rule)]"
      />
    );
  return (
    <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-[15px] font-semibold text-paper shadow-[0_0_0_3px_var(--color-paper),0_0_0_4px_var(--color-rule)]">
      {initials(name)}
    </span>
  );
}

export default function Testimonials({ items }: { items: PublicFeedback[] }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="people-title" className="border-t border-rule py-24 lg:py-32">
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
            From the people using it
          </p>
          <h2
            id="people-title"
            className="mt-4 max-w-[46rem] font-display text-[clamp(2.3rem,5vw,4rem)] font-[360] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            What people say after building theirs
          </h2>
        </Reveal>
        <ul className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
          {items.map((item, index) => (
            <li key={`${item.name}-${item.templateId}-${index}`} className="mb-5 break-inside-avoid">
              <Reveal delay={(index % 3) * 80}>
                <figure className="rounded-[22px] bg-[color-mix(in_oklab,var(--color-paper)_55%,white)] p-7 shadow-[0_0_0_1px_var(--color-rule),0_24px_48px_-30px_rgb(0_0_0/0.35)]">
                  <div className="flex gap-0.5" aria-label={`${item.stars} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, star) => (
                      <Star
                        key={star}
                        size={17}
                        className={star < item.stars ? "fill-amber-400 text-amber-500" : "text-ink/20"}
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 font-display text-[1.25rem] leading-snug text-ink">
                    “{item.comment}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center gap-3">
                    <Avatar name={item.name} image={item.image} />
                    <span>
                      <b className="block text-[15px] font-semibold text-ink">{item.name}</b>
                      <span className="text-[13px] text-ink-soft">
                        Built with {getTemplate(item.templateId)?.name ?? "Fuccura"}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
