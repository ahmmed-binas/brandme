import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";

export const metadata: Metadata = { title: "Sign in", description: "Sign in securely with your Google account." };
/** Only same-site paths are accepted, so the sign-in page cannot be used to redirect people elsewhere. */
const safeCallback = (value: string | string[] | undefined) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/account";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) { const callbackUrl = safeCallback((await searchParams).callbackUrl); return <main className="min-h-screen  px-5 py-12 sm:px-6 sm:py-20"><div className="mx-auto max-w-md"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-signal"><ArrowLeft size={16} /> Back to Formora</Link><div className="mt-10 rounded-2xl border border-rule bg-card p-7  sm:p-10"><p className="flex items-center gap-2 text-xs font-mono font-normal uppercase tracking-[0.2em] text-signal"><LockKeyhole size={14} /> Secure sign-in</p><h1 className="mt-3 font-display text-[2.2rem] font-[400] leading-[1.05] tracking-[-0.02em] [font-variation-settings:'opsz'_48] text-ink">Welcome to Formora.</h1><p className="mt-4 leading-7 text-ink-soft">Sign in with Google to access your account. We use Google’s secure OAuth flow—your password is never shared with Formora.</p><div className="mt-7"><GoogleSignInButton callbackUrl={callbackUrl} /></div><p className="mt-6 text-xs leading-5 text-ink-soft">Your tools remain free to use without an account. Sign in to save portfolios to your account and publish them at your own address.</p></div></div></main>; }
