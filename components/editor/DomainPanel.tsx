"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, CheckCircle2, Clock, Copy, Globe2, Loader2, RefreshCw, Search, ShoppingCart, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";

interface DomainView { domain: string; source: "connected" | "purchased"; status: "active" | "pending_dns" | "registering" | "failed"; records: Array<{ type: string; name: string; value: string }>; message?: string }
interface OrderView { id: string; domain: string; status: string; chargedCents: number; error: string | null }
interface Overview { domain: DomainView | null; orders: OrderView[]; capabilities: { canBuy: boolean; canConnect: boolean; planName: string } }
interface Offer { domain: string; available: boolean; priceCents: number | null; renewalCents: number | null }
type View = "home" | "buy" | "contact" | "connect";

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;
const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? "Something went wrong.");
  return body as T;
}

/** Every ISO country code the browser can name, for the registrant address. */
function useCountries() {
  return useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const list: Array<{ code: string; name: string }> = [];
    for (const a of letters) for (const b of letters) {
      const code = a + b;
      const name = names.of(code);
      if (name && !["EU", "EZ", "UN", "QO", "XA", "XB", "ZZ"].includes(code)) list.push({ code, name });
    }
    return list.sort((x, y) => x.name.localeCompare(y.name));
  }, []);
}

function CopyValue({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return <button type="button" onClick={() => void navigator.clipboard.writeText(value).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200); })} className="inline-flex items-center gap-1 break-all text-left font-mono text-xs text-slate-800 hover:text-blue-700" title="Copy">{value}{copied ? <Check size={12} className="shrink-0 text-emerald-600" /> : <Copy size={12} className="shrink-0 text-slate-400" />}</button>;
}

/** Custom domain setup for one portfolio: buy a new domain or connect one the user owns. */
export function DomainPanel({ templateId, personName, published }: { templateId: string; personName: string; published: boolean }) {
  const { data: session } = useSession();
  const countries = useCountries();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [view, setView] = useState<View>("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [chosen, setChosen] = useState<Offer | null>(null);
  const [owned, setOwned] = useState("");
  const [contact, setContact] = useState(() => {
    const [firstName = "", ...rest] = (session?.user?.name ?? "").split(" ");
    return { firstName, lastName: rest.join(" "), email: session?.user?.email ?? "", phone: "", address1: "", city: "", state: "", zip: "", country: "" };
  });

  const refresh = useCallback(async () => {
    try { setOverview(await call<Overview>(`/api/domains/${templateId}`)); } catch (caught) { setError((caught as Error).message); }
  }, [templateId]);
  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  // While a domain is being registered or DNS is propagating, check back periodically.
  const waiting = overview?.domain && overview.domain.status !== "active";
  useEffect(() => {
    if (!waiting) return;
    const timer = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [waiting, refresh]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await task(); } catch (caught) { setError((caught as Error).message); } finally { setBusy(false); }
  };
  const search = (term?: string) => run(async () => {
    const result = await call<{ offers: Offer[] }>(`/api/domains/${templateId}/search`, { method: "POST", body: JSON.stringify({ query: term || undefined, name: personName }) });
    setOffers(result.offers);
  });
  const openBuy = () => { setView("buy"); if (!offers) void search(); };
  const checkout = () => run(async () => {
    const { url } = await call<{ url: string }>(`/api/domains/${templateId}/checkout`, { method: "POST", body: JSON.stringify({ domain: chosen!.domain, contact }) });
    window.location.href = url;
  });
  const connect = () => run(async () => {
    const result = await call<{ domain: DomainView }>(`/api/domains/${templateId}`, { method: "POST", body: JSON.stringify({ domain: owned }) });
    setOverview((current) => current && { ...current, domain: result.domain });
    setView("home");
  });
  const remove = () => run(async () => {
    if (!window.confirm(`Disconnect ${overview?.domain?.domain}? ${overview?.domain?.source === "purchased" ? "You keep owning the domain; it just stops showing this portfolio." : ""}`)) return;
    await call(`/api/domains/${templateId}`, { method: "DELETE" });
    await refresh();
  });

  if (!overview) return <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Loading domain settings…</div>;
  const { domain, orders, capabilities } = overview;
  const lastProblem = orders.find((order) => ["refunded", "failed", "refund_failed"].includes(order.status) && order.error);
  const header = <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><Globe2 size={14} /> Custom domain</p>;
  const back = <button type="button" onClick={() => { setView("home"); setError(null); }} className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"><ArrowLeft size={13} /> Back</button>;
  const errorBox = error && <p className="rounded-lg bg-red-50 p-2.5 text-xs text-red-700">{error}</p>;

  if (domain) {
    const status = {
      active: <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 size={13} /> Live</span>,
      pending_dns: <span className="inline-flex items-center gap-1 text-amber-700"><Clock size={13} /> {domain.source === "purchased" ? "Securing" : "Waiting for DNS"}</span>,
      registering: <span className="inline-flex items-center gap-1 text-amber-700"><Loader2 size={13} className="animate-spin" /> Registering</span>,
      failed: <span className="text-red-700">Problem</span>,
    }[domain.status];
    return <div className="space-y-3">
      {header}
      <div className="rounded-xl border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2"><a href={`https://${domain.domain}`} target="_blank" rel="noreferrer" className="truncate text-sm font-bold text-slate-900 hover:underline">{domain.domain}</a><span className="shrink-0 text-xs font-bold">{status}</span></div>
        {domain.message && <p className="mt-2 text-xs leading-5 text-slate-600">{domain.message}</p>}
        {!published && domain.status === "active" && <p className="mt-2 text-xs text-amber-700">Publish your portfolio to show it on this domain.</p>}
        {domain.records.length > 0 && <table className="mt-3 w-full text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-1 pr-2 font-semibold">Type</th><th className="pb-1 pr-2 font-semibold">Name</th><th className="pb-1 font-semibold">Value</th></tr></thead><tbody>{domain.records.map((record) => <tr key={`${record.type}-${record.name}-${record.value}`} className="border-t border-slate-100 align-top"><td className="py-1.5 pr-2 font-mono font-bold">{record.type}</td><td className="py-1.5 pr-2"><CopyValue value={record.name} /></td><td className="py-1.5"><CopyValue value={record.value} /></td></tr>)}</tbody></table>}
        <div className="mt-3 flex gap-2">
          {domain.status !== "active" && <button type="button" disabled={busy} onClick={() => void run(refresh)} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold disabled:opacity-50"><RefreshCw size={12} className={busy ? "animate-spin" : ""} /> Check again</button>}
          <button type="button" disabled={busy || domain.status === "registering"} onClick={() => void remove()} className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50"><Trash2 size={12} /> Disconnect</button>
        </div>
      </div>
      {errorBox}
    </div>;
  }

  if (!capabilities.canBuy && !capabilities.canConnect) return <div className="space-y-2">{header}<p className="text-xs leading-5 text-slate-500">Custom domains aren’t available on this server yet.</p></div>;

  if (view === "buy") return <div className="space-y-3">
    {back}
    <form onSubmit={(event) => { event.preventDefault(); void search(query); }} className="flex gap-2">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a name or domain" aria-label="Search domains" className={inputClass} />
      <button disabled={busy} className="rounded-lg bg-slate-900 px-3 text-white disabled:opacity-50" aria-label="Search">{busy ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}</button>
    </form>
    {offers && <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">{offers.map((offer) => <li key={offer.domain} className="flex items-center justify-between gap-2 px-3 py-2">
      <span className={`truncate text-sm ${offer.available ? "font-semibold text-slate-900" : "text-slate-400 line-through"}`}>{offer.domain}</span>
      {offer.available && offer.priceCents !== null ? <button type="button" onClick={() => { setChosen(offer); setView("contact"); }} className="shrink-0 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700">{money(offer.priceCents)}/yr</button> : <span className="shrink-0 text-xs text-slate-400">Taken</span>}
    </li>)}</ul>}
    {errorBox}
    <p className="text-[11px] leading-4 text-slate-500">Price includes registration for one year, setup, and HTTPS. The domain is registered in your name.</p>
  </div>;

  if (view === "contact" && chosen) return <form onSubmit={(event) => { event.preventDefault(); void checkout(); }} className="space-y-2.5">
    {back}
    <p className="text-sm font-bold">{chosen.domain} <span className="font-normal text-slate-500">· {money(chosen.priceCents!)} for the first year</span></p>
    <p className="text-xs leading-5 text-slate-500">Domain registries require the owner’s contact details. They’re sent to the registrar and not stored by Formora after registration.</p>
    <div className="grid grid-cols-2 gap-2">
      <input required value={contact.firstName} onChange={(event) => setContact({ ...contact, firstName: event.target.value })} placeholder="First name" aria-label="First name" autoComplete="given-name" className={inputClass} />
      <input required value={contact.lastName} onChange={(event) => setContact({ ...contact, lastName: event.target.value })} placeholder="Last name" aria-label="Last name" autoComplete="family-name" className={inputClass} />
    </div>
    <input required type="email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} placeholder="Email" aria-label="Email" autoComplete="email" className={inputClass} />
    <input required value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} placeholder="Phone with country code, e.g. +44 7700 900123" aria-label="Phone" autoComplete="tel" className={inputClass} />
    <input required value={contact.address1} onChange={(event) => setContact({ ...contact, address1: event.target.value })} placeholder="Street address" aria-label="Street address" autoComplete="address-line1" className={inputClass} />
    <div className="grid grid-cols-2 gap-2">
      <input required value={contact.city} onChange={(event) => setContact({ ...contact, city: event.target.value })} placeholder="City" aria-label="City" autoComplete="address-level2" className={inputClass} />
      <input value={contact.state} onChange={(event) => setContact({ ...contact, state: event.target.value })} placeholder="State / region" aria-label="State or region" autoComplete="address-level1" className={inputClass} />
      <input required value={contact.zip} onChange={(event) => setContact({ ...contact, zip: event.target.value })} placeholder="Postcode" aria-label="Postcode" autoComplete="postal-code" className={inputClass} />
      <select required value={contact.country} onChange={(event) => setContact({ ...contact, country: event.target.value })} aria-label="Country" autoComplete="country" className={inputClass}><option value="">Country</option>{countries.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select>
    </div>
    {errorBox}
    <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? <Loader2 size={15} className="animate-spin" /> : <ShoppingCart size={15} />} Continue to payment</button>
    <p className="text-[11px] leading-4 text-slate-500">After payment we register the domain and connect it to your portfolio automatically. If registration fails, you’re refunded in full.</p>
  </form>;

  if (view === "connect") return <div className="space-y-3">
    {back}
    {capabilities.canConnect ? <form onSubmit={(event) => { event.preventDefault(); void connect(); }} className="space-y-2">
      <input value={owned} onChange={(event) => setOwned(event.target.value)} placeholder="yourname.com" aria-label="Your domain" className={inputClass} />
      <button disabled={busy || !owned.trim()} className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? "Connecting…" : "Connect domain"}</button>
      <p className="text-[11px] leading-4 text-slate-500">Next you’ll see the DNS records to add at your domain provider (GoDaddy, Namecheap, Cloudflare…). HTTPS is set up automatically.</p>
    </form> : <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">Connecting a domain you already own isn’t included in the {capabilities.planName} plan. You can still buy a new domain here; it’s connected automatically.</p>}
    {errorBox}
  </div>;

  return <div className="space-y-2.5">
    {header}
    {lastProblem && <p className="rounded-lg bg-amber-50 p-2.5 text-xs leading-5 text-amber-800">{lastProblem.error}</p>}
    <p className="text-xs leading-5 text-slate-600">Show your portfolio at your own address, like <b>{(personName || "yourname").toLowerCase().replace(/[^a-z0-9]+/g, "") || "yourname"}.com</b>.</p>
    <div className="grid grid-cols-2 gap-2">
      {capabilities.canBuy && <button type="button" onClick={openBuy} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100">Get a domain</button>}
      <button type="button" onClick={() => setView("connect")} className={`rounded-lg border px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 ${capabilities.canBuy ? "" : "col-span-2"}`}>I already own one</button>
    </div>
  </div>;
}
