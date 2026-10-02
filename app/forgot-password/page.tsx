import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { ForgotForm } from "@/components/auth/AuthForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPage() {
  return <AuthCard eyebrow="Password help" title="Forgot your password?" intro="Enter the email you signed up with and we’ll send you a link to choose a new one. If you use Google to sign in, there’s no password to reset." footer={<Link href="/login" className="underline underline-offset-4">Back to sign in</Link>}>
    <ForgotForm />
  </AuthCard>;
}
