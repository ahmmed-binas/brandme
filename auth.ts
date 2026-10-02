import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { saveGoogleUser } from "@/utils/user-account";

declare module "next-auth" {
  interface Session {
    user: { providerAccountId?: string } & DefaultSession["user"];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({})],
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    // Without a database adapter Auth.js assigns a random user id per sign-in, so
    // the stable Google account id is carried in the token to identify owners.
    jwt({ token, account }) {
      if (account?.provider === "google" && account.providerAccountId) token.providerAccountId = account.providerAccountId;
      return token;
    },
    session({ session, token }) {
      if (typeof token.providerAccountId === "string") session.user.providerAccountId = token.providerAccountId;
      return session;
    },
  },
  events: { async signIn({ user, account }) { if (account?.provider === "google" && account.providerAccountId) await saveGoogleUser({ providerAccountId: account.providerAccountId, email: user.email, name: user.name, image: user.image }); } },
});
