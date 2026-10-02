import type { Metadata } from "next";
import Link from "next/link";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";
import DevSignInForm from "@/components/common/DevSignInForm";
import { AuthCard, Divider, safeCallback } from "@/components/auth/AuthCard";
import { PasswordSignIn } from "@/components/auth/AuthForms";
import { devLoginEnabled } from "@/lib/dev-login";

export const metadata: Metadata = { title: "Sign in", description: "Sign in with Google, or with your email and password." };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  return <AuthCard eyebrow="Secure sign-in" title="Welcome back." footer={<>New here? <Link href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-ink underline underline-offset-4">Create an account</Link></>}>
    <GoogleSignInButton callbackUrl={callbackUrl} />
    <Divider label="or with email" />
    <PasswordSignIn callbackUrl={callbackUrl} />
    {devLoginEnabled() && <DevSignInForm callbackUrl={callbackUrl} />}
  </AuthCard>;
}
