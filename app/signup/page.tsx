import type { Metadata } from "next";
import Link from "next/link";
import GoogleSignInButton from "@/components/common/GoogleSignInButton";
import { AuthCard, Divider, safeCallback } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Create an account", description: "Create a free account to build your portfolio and share templates in the gallery." };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string | string[] }> }) {
  const callbackUrl = safeCallback((await searchParams).callbackUrl);
  return <AuthCard eyebrow="Free account" title="Create your account." intro="Build and publish your portfolio, rate templates, and share your own designs in the gallery." footer={<>Already have an account? <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="font-medium text-ink underline underline-offset-4">Sign in</Link></>}>
    <GoogleSignInButton callbackUrl={callbackUrl} />
    <Divider label="or with email" />
    <SignUpForm callbackUrl={callbackUrl} />
  </AuthCard>;
}
