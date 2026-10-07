import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/common/LegalPage";
import { brand } from "@/lib/brand";
import { governingCountry, legal, operator } from "@/lib/legal";
import { GRACE_DAYS, PLANS, formatUsd } from "@/lib/plans";
import { MIN_AGE } from "@/lib/accounts/passwords";

export const metadata: Metadata = {
  title: "Terms",
  description: `The terms for using ${brand.name}: accounts, plans, payments, refunds and your content.`,
  alternates: { canonical: "/terms" },
};

// Reads the operator's details from the server's settings.
export const dynamic = "force-dynamic";

const mail = <a href={`mailto:${legal.email}`} className="text-ink underline underline-offset-4">{legal.email}</a>;

export default function TermsPage() {
  const sections: LegalSection[] = [
    { title: "About these terms", body: [
      <>{brand.name} is run by {operator()}. By creating an account or using the site you agree to these terms and to our <Link href="/privacy" className="text-ink underline underline-offset-4">privacy policy</Link>. You need to be at least {MIN_AGE}.</>,
    ] },
    { title: "Your account", body: [
      <>Keep your sign-in details safe; you’re responsible for what happens in your account. Tell us at {mail} if you think someone else has used it. You can delete your account at any time from your account page.</>,
    ] },
    { title: "Your content", body: [
      <>What you put in {brand.name} stays yours. You give us permission to store it, show it where you publish it, and process it to run the features you use (for example AI help). That permission ends when you delete the content or your account.</>,
      <>Only publish what you have the right to publish. Don’t use {brand.name} for anything unlawful, misleading, hateful or harmful, to impersonate someone, or to collect other people’s data. We may take down content or close accounts that break these rules, and we’ll tell you why unless the law stops us.</>,
      <>The Investigator may only be used for your own profiles, with your consent.</>,
    ] },
    { title: "Plans and payments", body: [
      <><b className="font-medium text-ink">Basic</b> is free. <b className="font-medium text-ink">Pro</b> costs {formatUsd(PLANS.pro.prices.year!)} a year or {formatUsd(PLANS.pro.prices.month!)} a month, paid in advance. Prices are in US dollars and shown before you pay; your bank may add its own currency fees.</>,
      <>Pro renews automatically with the card you paid with, each year or month, until you switch renewal off in your account. We email yearly payers two weeks before. If a renewal fails or you switch it off, Pro keeps working for {GRACE_DAYS} days and then your account moves to Basic: your first published site stays online, any others are taken offline, and nothing is deleted.</>,
      <><b className="font-medium text-ink">AI credits</b> are prepaid, priced at what the AI costs us plus 5%, and don’t expire. <b className="font-medium text-ink">Domains</b> are sold at the registrar’s price. For credits and domains, the card fee charged by Stripe is shown as its own line.</>,
    ] },
    { title: "Refunds", body: [
      <>You can ask for a refund of Pro within 14 days of paying, and of AI credits you haven’t used, by replying to your receipt or writing to {mail}. Stripe doesn’t return its card fee when a payment is refunded, so the refund is the payment minus that fee. We tell you this before you pay.</>,
      <>A domain can’t be refunded once it has been registered, because the registrar doesn’t refund us. If registration fails, you’re refunded in full automatically.</>,
      <>Nothing here takes away rights you have under the consumer law of the country you live in.</>,
    ] },
    { title: "Domains", body: [
      <>A domain bought through {brand.name} is registered in your name and is yours. Domains don’t renew on their own: we remind you before they expire, and they renew only when you pay. If one expires, someone else may register it.</>,
    ] },
    { title: "The service", body: [
      <>We work hard to keep {brand.name} running and your content safe, but we can’t promise it will never be interrupted or free of mistakes. AI features and the Investigator can get things wrong; check what they suggest before relying on it. We may change or stop features, and if we ever close {brand.name} we’ll give you at least 30 days’ notice to download your content.</>,
      <>As far as the law allows, we’re not liable for indirect losses, and our total liability to you is limited to what you paid us in the 12 months before the claim.</>,
    ] },
    { title: "Free templates", body: [<>Templates downloaded from the gallery come with the licence shown on their page.</>] },
    { title: "Changes and the law", body: [
      <>If we change these terms we’ll update the date at the top and email you about anything that affects you. These terms are governed by the law of {governingCountry()}.</>,
    ] },
  ];
  return <LegalPage eyebrow="Terms" title="Terms of use" intro={<p>The short version: Basic is free, Pro is paid in advance and renews until you stop it, AI is sold at cost, your content is yours, and you can leave at any time.</p>} sections={sections} />;
}
