import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/common/LegalPage";
import { brand } from "@/lib/brand";
import { legal, operator } from "@/lib/legal";
import { MIN_AGE } from "@/lib/accounts/passwords";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `What ${brand.name} collects, why, who it’s shared with, and how to see or delete it.`,
  alternates: { canonical: "/privacy" },
};

// Reads the operator's details from the server's settings.
export const dynamic = "force-dynamic";

const mail = <a href={`mailto:${legal.email}`} className="text-ink underline underline-offset-4">{legal.email}</a>;

export default function PrivacyPage() {
  const sections: LegalSection[] = [
    { title: "Who we are", body: [
      <>{brand.name} is run by {operator()}{legal.address ? `, ${legal.address}` : ""}. We decide how the personal data described here is used. Questions about privacy go to {mail}.</>,
    ] },
    { title: "What we collect, and why", body: [
      <><b className="font-medium text-ink">Your account.</b> Your email address and name, and your profile picture if you sign in with Google. If you sign up with a password we store a scrambled version of it (never the password itself), a username, and your date of birth, which we use only to check you’re at least {MIN_AGE}. We need these to give you an account.</>,
      <><b className="font-medium text-ink">What you make.</b> The content and images you put in your portfolios and blog posts. When you publish, that content is shown publicly at the address you choose. Drafts are private to you.</>,
      <><b className="font-medium text-ink">Payments.</b> If you pay, Stripe handles your card; we never see or store card numbers. We keep a record of what you bought and when, and Stripe’s customer and payment-method references so a plan can renew if you’ve chosen that.</>,
      <><b className="font-medium text-ink">Domains.</b> When you buy a domain, domain registries require the owner’s name, address, email and phone number. We pass these to the registrar to register the domain in your name and don’t keep them afterwards.</>,
      <><b className="font-medium text-ink">AI features.</b> When you use the AI assistant, import a CV or LinkedIn export, or run the Investigator, the text involved is sent to Anthropic (who make Claude) to process the request. If you save your own Claude API key, we store it encrypted and use it only for your requests.</>,
      <><b className="font-medium text-ink">The Investigator.</b> If you switch it on, it reads the public profiles you give it and searches the web for your professional news, on the schedule you choose. It only looks at you, only at public pages, and only with your consent; it never logs in anywhere. What it finds is stored with your account so you can review or undo it.</>,
      <><b className="font-medium text-ink">Visitor counts.</b> We count page views without cookies and without storing IP addresses: each visit is counted with a code that changes every day, so a visitor can’t be followed from one day to the next. Counts are deleted after about 13 months.</>,
      <><b className="font-medium text-ink">Messages.</b> Support requests, community posts and template submissions you send us, and booking details if you book a call (through Cal.com).</>,
    ] },
    { title: "Cookies", body: [
      <>We use only the cookies needed to keep you signed in and to protect sign-in forms. There are no advertising or tracking cookies, so there’s no cookie banner.</>,
    ] },
    { title: "Who we share it with", body: [
      <>We don’t sell your data. We share it only with the services that help us run {brand.name}, and only what each one needs:</>,
      <ul key="services" className="list-disc space-y-1 pl-5"><li>our hosting provider, where the site and database run;</li><li>Stripe, for payments;</li><li>our domain registrar, when you buy a domain;</li><li>Anthropic, for AI features;</li><li>Google, if you choose to sign in with Google;</li><li>our email provider, to send account emails and receipts;</li><li>Cal.com, if you book a call.</li></ul>,
      <>Some of these are in other countries, including the United States. We may also disclose information if the law requires it.</>,
    ] },
    { title: "How long we keep it", body: [
      <>We keep your account and content until you delete them. Payment records are kept as long as tax and accounting rules require, even after an account is deleted. Visitor counts are kept for about 13 months.</>,
    ] },
    { title: "Your choices and rights", body: [
      <>You can see and change your details and content in <Link href="/account" className="text-ink underline underline-offset-4">your account</Link>, switch off reminder emails there, and switch the Investigator off at any time.</>,
      <>You can <b className="font-medium text-ink">delete your account</b> from your account page. That deletes your portfolios, images, posts and settings straight away and takes your published sites offline.</>,
      <>You can also ask us for a copy of your data, or to correct or delete it, by writing to {mail}. Depending on where you live you may have further rights, including complaining to your data-protection authority.</>,
    ] },
    { title: "Children", body: [<>{brand.name} isn’t meant for anyone under {MIN_AGE}, and we don’t knowingly collect their data.</>] },
    { title: "Changes", body: [<>If we change this policy we’ll update the date at the top, and tell you by email if the change matters to how your data is used.</>] },
  ];
  return <LegalPage eyebrow="Privacy" title="Privacy policy" intro={<p>This explains what {brand.name} collects when you use it, why, and what you can do about it. We try to collect as little as we can.</p>} sections={sections} />;
}
