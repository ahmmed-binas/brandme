import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { devLoginEnabled } from "@/lib/dev-login";
import { saveGoogleUser } from "@/utils/user-account";

declare module "next-auth" {
  interface Session {
    user: { providerAccountId?: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({}),
    // Local testing only (see lib/dev-login.ts): signs in as any email, no password.
    ...(devLoginEnabled() ? [Credentials({
      id: "dev",
      name: "Local test account",
      credentials: { email: { label: "Email", type: "email" }, name: { label: "Name", type: "text" } },
      authorize(input) {
        const email = String(input?.email ?? "").trim().toLowerCase();
        if (!devLoginEnabled() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        const name = String(input?.name ?? "").trim() || email.split("@")[0]!;
        return { id: `dev:${email}`, email, name };
      },
    })] : []),
  ],
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    // Without a database adapter Auth.js assigns a random user id per sign-in, so
    // the stable Google account id is carried in the token to identify owners.
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) token.providerAccountId = account.providerAccountId;
      if (account?.provider === "dev" && account.providerAccountId) token.providerAccountId = account.providerAccountId;
      return token;
    },
    session({ session, token }) {
      if (typeof token.providerAccountId === "string") session.user.providerAccountId = token.providerAccountId;
      return session;
    },
  },
  events: { async signIn({ user, account }) { if ((account?.provider === "google" || account?.provider === "dev") && account.providerAccountId) await saveGoogleUser({ providerAccountId: account.providerAccountId, email: user.email, name: user.name, image: user.image }); } },
});
