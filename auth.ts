import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { devLoginEnabled } from "@/lib/dev-login";
import { saveGoogleUser } from "@/utils/user-account";
import { checkCredentials } from "@/lib/accounts/passwords";
import { clientIp, failuresBlocked, rateLimit, recordFailure } from "@/lib/security/rate-limit";

declare module "next-auth" {
  interface Session {
    user: { providerAccountId?: string; provider?: string; console?: boolean } & DefaultSession["user"];
  }
}

/** How long a superadmin console sign-in keeps its powers. */
const CONSOLE_SESSION_MS = 12 * 60 * 60 * 1000;

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
        const ip = clientIp(request);
        // Stored in the database, so the limits hold across restarts: 10 tries per account and 30 per address every 15 minutes.
        if (!(await rateLimit(`login:${login}`, 10, 900)) || !(await rateLimit(`login-ip:${ip}`, 30, 900))) return null;
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
        const ip = clientIp(request);
        // Five wrong passwords (per email) or ten (per address) pause console sign-in for 15 minutes.
        if (await failuresBlocked(`console:${login}`, 5, 900) || await failuresBlocked(`console-ip:${ip}`, 10, 900)) return null;
        const account = await checkCredentials(login, password, "console");
        if (!account) { await recordFailure(`console:${login}`, 900); await recordFailure(`console-ip:${ip}`, 900); return null; }
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
      if (account?.provider === "console") token.consoleAt = Date.now();
      return token;
    },
    session({ session, token }) {
      if (typeof token.providerAccountId === "string") session.user.providerAccountId = token.providerAccountId;
      session.user.provider = token.provider === "password" ? "password" : "google";
      // Superadmin powers lapse 12 hours after the console sign-in, however long the session lasts.
      session.user.console = token.console === true && typeof token.consoleAt === "number" && Date.now() - token.consoleAt < CONSOLE_SESSION_MS;
      return session;
    },
  },
  events: { async signIn({ user, account }) { if ((account?.provider === "google" || account?.provider === "dev") && account.providerAccountId) await saveGoogleUser({ providerAccountId: account.providerAccountId, email: user.email, name: user.name, image: user.image }); } },
});
