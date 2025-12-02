import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import GoogleProvider, { type GoogleProfile } from "next-auth/providers/google";
import type { Adapter } from "@auth/core/adapters";
import type { JWT } from "@auth/core/jwt";

// Extend the session type to include the user ID
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

// Ensure required environment variables are set
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID is not set');
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET is not set');
}
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET is not set');
}

const isProduction = process.env.NODE_ENV === 'production';
const baseUrl = isProduction 
  ? process.env.NEXTAUTH_URL || 'https://career-advisor-bot-3-git-923c1f-kusumavkusav13-4095s-projects.vercel.app'
  : 'http://localhost:3000';

export const authOptions: NextAuthConfig = {
  adapter: DrizzleAdapter(db) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
          scope: 'openid email profile',
        },
      },
      // @ts-ignore - httpOptions is not in the type definition but is supported
      httpOptions: {
        timeout: 10000, // 10 seconds
      },
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub || (token as JWT & { id?: string }).id || '';
      }
      return session;
    },
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        (token as JWT & { id?: string }).id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
  cookies: {
    sessionToken: {
      name: isProduction 
        ? `__Secure-next-auth.session-token` 
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: isProduction,
        domain: isProduction ? '.vercel.app' : undefined,
      },
    },
  },
  debug: !isProduction,
  logger: {
    error: (error: Error) => {
      console.error({ type: 'auth error', error });
    },
    warn: (code: string) => {
      console.warn({ type: 'auth warning', code });
    },
    debug: (code: string, metadata: any) => {
      if (!isProduction) {
        console.debug({ type: 'auth debug', code, metadata });
      }
    },
  },
};

// Export the auth handlers with proper configuration
export const { 
  handlers, 
  auth, 
  signIn, 
  signOut 
} = NextAuth({
  ...authOptions,
  secret: process.env.NEXTAUTH_SECRET!,
  trustHost: true, // Required for Vercel deployment
});
