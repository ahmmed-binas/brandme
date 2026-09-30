import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveGoogleUser } from "@/utils/user-account";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google({})],
  pages: { signIn: "/login" },
  trustHost: true,
  events: { async signIn({ user, account }) { if (account?.provider === "google" && account.providerAccountId) await saveGoogleUser({ providerAccountId: account.providerAccountId, email: user.email, name: user.name, image: user.image }); } },
});
