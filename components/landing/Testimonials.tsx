import { Star } from "lucide-react";
import Reveal from "@/components/landing/Reveal";
import { RateTemplate, type RatingSummary } from "@/components/templates/Rating";

/**
 * The home page's reviews section (#reviews). Everything in it is real:
 * - notes from the editor's rating card that the person agreed to share and
 *   the owner chose (console > Feedback), and
 * - reviews of Kitefolio itself, left right here (key SITE_RATING_KEY), once
 *   the owner switched them on in Console > Feedback, with a name and photo
 *   only when the person ticked “show my name and photo”.
 * Until there are any, it says so and asks people to be the first. Never add
 * made-up reviews: they mislead customers and break consumer law and Google's rules.
 */

export interface Review {
  /** Null when the person chose to stay anonymous. */
  name: string | null;
  image: string | null;
  stars: number;
  comment: string;
  /** A short line under the name, e.g. “Built with Skyline”. */
  context: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  const ring = "shadow-[0_0_0_3px_var(--color-paper),0_0_0_4px_var(--color-rule)]";
  if (image)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- their account photo, from their sign-in provider
      <img
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        className={`size-12 shrink-0 rounded-full object-cover ${ring}`}
      />
    );
  return (
    <span
      className={`grid size-12 shrink-0 place-items-center rounded-full bg-ink text-[15px] font-semibold text-paper ${ring}`}
    >
      {name ? initials(name) : "K"}
    </span>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, star) => (
        <Star
          key={star}
          size={17}
          className={star < count ? "fill-amber-400 text-amber-500" : "text-ink/20"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <figure className="rounded-[22px] bg-[color-mix(in_oklab,var(--color-paper)_55%,white)] p-7 shadow-[0_0_0_1px_var(--color-rule),0_24px_48px_-30px_rgb(0_0_0/0.35)]">
      <Stars count={review.stars} />
      <blockquote className="mt-4 font-display text-[1.25rem] leading-snug text-ink">
        “{review.comment}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        <Avatar name={review.name} image={review.image} />
        <span>
          <b className="block text-[15px] font-semibold text-ink">{review.name ?? "A Kitefolio member"}</b>
          <span className="text-[13px] text-ink-soft">{review.context}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Testimonials({ items, summary }: { items: Review[]; summary: RatingSummary }) {
  return (
    <section
      id="reviews"
      aria-labelledby="people-title"
      className="scroll-mt-16 border-t border-rule py-24 lg:py-32"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">
        <Reveal>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">Reviews</p>
          <h2
            id="people-title"
            className="mt-4 max-w-[46rem] font-display text-[clamp(2.3rem,5vw,4rem)] font-[360] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            What people say after building theirs
          </h2>
          <p className="mt-6 max-w-[38rem] text-[1.02rem] leading-[1.7] text-ink-soft">
            {items.length
              ? "Real reviews from people who built their site with Kitefolio. Built yours? Rate it below."
              : "Kitefolio opened in October 2026, so there are no reviews yet. Built your site? Be the first to rate it. We read every review before it appears here, and your name and photo only show if you tick the box."}
          </p>
          <div className="mt-6">
            <RateTemplate
              templateId="kitefolio"
              initial={summary}
              endpoint="/api/site/rating"
              returnTo="/#reviews"
            />
          </div>
        </Reveal>
        {items.length > 0 && (
          <ul className="mt-14 columns-1 gap-5 sm:columns-2 lg:columns-3">
            {items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="mb-5 break-inside-avoid">
                <Reveal delay={(index % 3) * 80}>
                  <ReviewCard review={item} />
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
