import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";

export const metadata: Metadata = { title: "Sign in", description: "Sign in securely with your Google account." };
/** Only same-site paths are accepted, so the sign-in page cannot be used to redirect people elsewhere. */
const safeCallback = (value: string | string[] | undefined) => typeof value === "string" && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") ? value : "/account";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) { const callbackUrl = safeCallback((await searchParams).callbackUrl); return <main className="min-h-screen bg-slate-50 px-5 py-12 dark:bg-slate-950 sm:px-6 sm:py-20"><div className="mx-auto max-w-md"><Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 dark:text-violet-300"><ArrowLeft size={16} /> Back to Formora</Link><div className="mt-10 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900 sm:p-10"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-violet-700 dark:text-violet-300"><LockKeyhole size={14} /> Secure sign-in</p><h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Welcome to Formora.</h1><p className="mt-4 leading-7 text-slate-600 dark:text-slate-400">Sign in with Google to access your account. We use Google’s secure OAuth flow—your password is never shared with Formora.</p><div className="mt-7"><GoogleSignInButton callbackUrl={callbackUrl} /></div><p className="mt-6 text-xs leading-5 text-slate-500">Your tools remain free to use without an account. Sign in to save portfolios to your account and publish them at your own address.</p></div></div></main>; }
