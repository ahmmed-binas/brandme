import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { devLoginEnabled } from "@/lib/dev-login";
import { saveGoogleUser } from "@/utils/user-account";
import { blockedAfterFailures, checkCredentials, noteFailure, tooManyAttempts } from "@/lib/accounts/passwords";

declare module "next-auth" {
  interface Session {
    user: { providerAccountId?: string; provider?: string; console?: boolean } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({}),
    // Email (or username) and password. Accounts are created at /signup (lib/accounts/passwords.ts).
    Credentials({
      id: "password",
      name: "Email and password",
      credentials: { login: { label: "Email or username", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(input, request) {
        const login = String(input?.login ?? "").trim().toLowerCase();
        const password = String(input?.password ?? "");
        if (!login || !password) return null;
        const ip = request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (tooManyAttempts(`login:${login}`) || tooManyAttempts(`login-ip:${ip}`, 30)) return null;
        const account = await checkCredentials(login, password);
        return account ? { id: account.providerAccountId, email: account.email, name: account.name } : null;
      },
    }),
    // The superadmin's sign-in, used only by the console at its secret address (lib/console/path.ts).
    Credentials({
      id: "console",
      name: "Console",
      credentials: { login: { label: "Email", type: "text" }, password: { label: "Password", type: "password" } },
      async authorize(input, request) {
        const login = String(input?.login ?? "").trim().toLowerCase();
        const password = String(input?.password ?? "");
        if (!login || !password) return null;
        const ip = request?.headers?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        // Five wrong passwords (per email) or ten (per address) pause console sign-in for 15 minutes.
        if (blockedAfterFailures(`console:${login}`, 5) || blockedAfterFailures(`console-ip:${ip}`, 10)) return null;
        const account = await checkCredentials(login, password, "console");
        if (!account) { noteFailure(`console:${login}`); noteFailure(`console-ip:${ip}`); return null; }
        return { id: account.providerAccountId, email: account.email, name: account.name };
      },
    }),
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
      if ((account?.provider === "password" || account?.provider === "console") && account.providerAccountId) token.providerAccountId = account.providerAccountId;
      // Google and the local test login share Google-style rows; password accounts (and the console) have their own.
      if (account) token.provider = account.provider === "password" || account.provider === "console" ? "password" : "google";
      // Superadmin powers come only with a console sign-in.
      if (account) token.console = account.provider === "console";
      return token;
    },
    session({ session, token }) {
      if (typeof token.providerAccountId === "string") session.user.providerAccountId = token.providerAccountId;
      session.user.provider = token.provider === "password" ? "password" : "google";
      session.user.console = token.console === true;
      return session;
    },
  },
  events: { async signIn({ user, account }) { if ((account?.provider === "google" || account?.provider === "dev") && account.providerAccountId) await saveGoogleUser({ providerAccountId: account.providerAccountId, email: user.email, name: user.name, image: user.image }); } },
});
