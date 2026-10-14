/**
 * Small labels on a template's card: “3D” for the interactive 3D designs and
 * “Pro” for designs only paid plans can save and publish. Sits in the card's
 * top-right corner; the card must be `relative`.
 */
export function TemplateBadges({
  threeD,
  pro,
  className = "absolute right-3 top-3",
}: {
  threeD?: boolean;
  pro?: boolean;
  className?: string;
}) {
  if (!threeD && !pro) return null;
  return (
    <span className={`pointer-events-none flex gap-1.5 ${className}`}>
      {threeD && (
        <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white backdrop-blur">
          3D
        </span>
      )}
      {pro && (
        <span className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm">
          Pro
        </span>
      )}
    </span>
  );
}
