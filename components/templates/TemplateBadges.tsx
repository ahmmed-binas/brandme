/**
 * Small labels on a template's card: “3D” for the interactive 3D designs and
 * “Pro” for designs only paid plans can save and publish. Sits in the card's
 * top-right corner; the card must be `relative`.
 */
export function TemplateBadges({
  threeD,
  pro,
  badges = [],
  className = "absolute right-3 top-3",
}: {
  threeD?: boolean;
  pro?: boolean;
  /** The superadmin's labels (Console > Catalog). "3D" and "Pro" there turn those badges on too. */
  badges?: string[];
  className?: string;
}) {
  const named = (name: string) => badges.some((badge) => badge.toLowerCase() === name.toLowerCase());
  const showThreeD = threeD || named("3D");
  const showPro = pro || named("Pro");
  const others = badges.filter((badge) => !/^(3d|pro)$/i.test(badge));
  if (!showThreeD && !showPro && others.length === 0) return null;
  return (
    <span className={`pointer-events-none flex flex-wrap justify-end gap-1.5 ${className}`}>
      {others.map((badge) => (
        <span
          key={badge}
          className="rounded-full bg-[#2338e0] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm"
        >
          {badge}
        </span>
      ))}
      {showThreeD && (
        <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          3D
        </span>
      )}
      {showPro && (
        <span className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm">
          Pro
        </span>
      )}
    </span>
  );
}
