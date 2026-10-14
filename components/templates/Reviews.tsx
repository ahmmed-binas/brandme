import { Star } from "lucide-react";
import { publicReviews } from "@/lib/templates/ratings";

/**
 * “What people said”: comments left with a star rating on this page.
 * Name and photo appear only for people who ticked “show my name and photo”;
 * everyone else is shown as a Kitefolio member. Hidden reviews (console) and
 * ratings without a comment don't appear. Nothing renders until there's one.
 */

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const when = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export async function Reviews({
  ratingKey,
  title,
  className = "",
}: {
  ratingKey: string;
  title: string;
  className?: string;
}) {
  const reviews = await publicReviews(ratingKey);
  if (!reviews.length) return null;
  return (
    <section className={className} aria-labelledby="reviews">
      <h2
        id="reviews"
        className="font-display text-[clamp(1.9rem,4vw,3rem)] leading-none tracking-[-0.02em] text-ink"
      >
        {title}
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {reviews.map((review, index) => {
          const name = review.name ?? "A Kitefolio member";
          return (
            <li key={index} className="rounded-2xl border border-rule bg-card p-6">
              <div className="flex gap-0.5" aria-label={`${review.stars} out of 5 stars`}>
                {Array.from({ length: 5 }, (_, star) => (
                  <Star
                    key={star}
                    size={15}
                    className={star < review.stars ? "fill-amber-400 text-amber-400" : "text-ink/20"}
                  />
                ))}
              </div>
              <p className="mt-3 leading-relaxed text-ink">“{review.comment}”</p>
              <div className="mt-4 flex items-center gap-3">
                {review.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- their account photo, from their sign-in provider
                  <img
                    src={review.image}
                    alt=""
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-full bg-ink/[0.08] text-[12px] font-semibold text-ink-soft">
                    {review.name ? initials(review.name) : "F"}
                  </span>
                )}
                <span className="text-[0.88rem]">
                  <b className="font-medium text-ink">{name}</b>
                  <span className="block text-ink-soft">{when(review.at)}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
