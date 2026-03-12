import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Simple in-memory demo users and cleaner OTP store.
// In production, replace this with a real database.

type Role = "admin" | "customer" | "cleaner";

interface DemoUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: Role;
  password?: string;
}

const demoUsers: DemoUser[] = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@shalean.test",
    password: "admin123",
    role: "admin",
  },
  {
    id: "customer-1",
    name: "Customer User",
    email: "customer@shalean.test",
    password: "customer123",
    role: "customer",
  },
  {
    id: "cleaner-1",
    name: "Nomsa Cleaner",
    phone: "+27820000001",
    role: "cleaner",
  },
];

type CleanerCodeRecord = {
  phone: string;
  code: string;
  expiresAt: number;
};

const cleanerCodes = new Map<string, CleanerCodeRecord>();

export function createCleanerCode(phone: string, code: string, ttlMs: number) {
  const record: CleanerCodeRecord = {
    phone,
    code,
    expiresAt: Date.now() + ttlMs,
  };
  cleanerCodes.set(phone, record);
}

export function verifyCleanerCode(phone: string, code: string) {
  const record = cleanerCodes.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    cleanerCodes.delete(phone);
    return false;
  }
  const ok = record.code === code;
  if (ok) {
    cleanerCodes.delete(phone);
  }
  return ok;
}

const config = {
  providers: [
    Credentials({
      id: "email-credentials",
      name: "Email & Password",
      credentials: {
        role: { label: "Role", type: "text" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const role = credentials.role as Role | undefined;
        const email = credentials.email?.toLowerCase();
        const password = credentials.password;

        if (!role || !email || !password) return null;

        const user = demoUsers.find(
          (u) =>
            u.role === role &&
            u.email &&
            u.email.toLowerCase() === email &&
            u.password === password,
        );

        if (!user) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
    Credentials({
      id: "cleaner-phone",
      name: "Cleaner Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const phone = credentials.phone as string | undefined;
        const code = credentials.code as string | undefined;
        if (!phone || !code) return null;

        const cleaner = demoUsers.find(
          (u) => u.role === "cleaner" && u.phone === phone,
        );
        if (!cleaner) return null;

        const ok = verifyCleanerCode(phone, code);
        if (!ok) return null;

        return {
          id: cleaner.id,
          name: cleaner.name,
          role: cleaner.role,
          phone: cleaner.phone,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Persist role and phone on JWT when user logs in
        const anyUser = user as any;
        token.role = anyUser.role;
        if (anyUser.phone) token.phone = anyUser.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = (token as any).role;
        if ((token as any).phone) {
          (session.user as any).phone = (token as any).phone;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(config);

