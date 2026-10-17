import ConsoleLogin from "@/components/console/ConsoleLogin";
import PricesForm from "@/components/console/PricesForm";
import Shell from "@/components/console/Shell";
import TemplateTags from "@/components/console/TemplateTags";
import { PRICE_FIELDS, getPrices } from "@/lib/settings/prices";
import { availableTemplates } from "@/lib/templates/approval";
import { getTemplate } from "@/lib/templates/catalog";
import { PRESET_BADGES, templateOverrides } from "@/lib/templates/overrides";
import { getCurrentUser } from "@/utils/user-account";

export const dynamic = "force-dynamic";

const panel = "rounded-xl border border-[var(--c-line)] bg-[var(--c-panel)]";

/**
 * Console > Catalog: the plan prices, and each template's labels and Pro
 * switch. Changes show on the site straight away.
 */
export default async function ConsoleCatalog() {
  const user = await getCurrentUser().catch(() => null);
  if (!user?.isSuperadmin) return <ConsoleLogin />;
  const [prices, templates, overrides] = await Promise.all([
    getPrices(),
    availableTemplates(true),
    templateOverrides(),
  ]);
  const studio = templates.filter((template) => template.collection === "studio");

  return (
    <Shell active="Catalog" userId={user.id} email={user.email}>
      <header>
        <p className="text-[12px] uppercase tracking-[0.16em] text-[var(--c-muted)]">Catalog</p>
        <h1 className="mt-1 text-[1.5rem] font-semibold tracking-tight">Prices and template labels</h1>
      </header>

      <section className={`${panel} mt-6 p-5`}>
        <h2 className="text-[14px] font-semibold">Plan prices (AED)</h2>
        <p className="mt-1 text-[12.5px] text-[var(--c-text2)]">
          Shown on the pricing page, home page, FAQs, job pages, terms and llms.txt. Paid plans still start on
          WhatsApp; when online checkout goes live, its prices must be set to match.
        </p>
        <div className="mt-4">
          <PricesForm fields={PRICE_FIELDS} initial={{ ...prices }} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-[14px] font-semibold">Template labels ({studio.length})</h2>
        <p className="mt-1 text-[12.5px] text-[var(--c-text2)]">
          Labels show on each template’s card (up to four). “3D” and “Pro” turn those badges on. The Pro
          switch also decides who can save and publish it: on means paid plans only.
        </p>
        <ul className={`${panel} mt-3 divide-y divide-[var(--c-line)]`}>
          {studio.map((template) => {
            const override = overrides.get(template.id);
            return (
              <li key={template.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <span className="min-w-[10rem] text-[13px]">
                  <b className="font-medium">{template.name}</b>
                  <span className="ml-2 text-[11.5px] text-[var(--c-muted)]">
                    {template.review.status === "approved" ? "live" : template.review.status}
                    {template.threeD ? " · 3D" : ""}
                  </span>
                </span>
                <TemplateTags
                  templateId={template.id}
                  presets={PRESET_BADGES}
                  catalogPro={Boolean(getTemplate(template.id)?.proOnly)}
                  initialBadges={override?.badges ?? []}
                  initialPro={override?.proOnly ?? null}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}
