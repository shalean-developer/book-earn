import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@supabase/supabase-js";

type Role = "admin" | "customer" | "cleaner";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) {
    throw new Error(
      `Auth config: missing required env var "${name}". Set it in Vercel (Settings → Environment Variables) and redeploy.`
    );
  }
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = createClient(supabaseUrl, supabaseServiceRoleKey);

export const authOptions: NextAuthOptions = {
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
        const password = credentials.password as string | undefined;

        if (!role || !email || !password) return null;
        if (role !== "admin" && role !== "customer") return null;

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email,
          password,
        });

        if (error || !data?.user) {
          return null;
        }

        const user = data.user;

        const { data: profile } = await supabaseService
          .from("profiles")
          .select("name, role, phone")
          .eq("id", user.id)
          .maybeSingle();

        const profileRole = (profile?.role as Role | undefined) ?? "customer";
        if (profileRole !== role) {
          return null;
        }

        return {
          id: user.id,
          name:
            (profile?.name && String(profile.name).trim()) ||
            (user.user_metadata?.name as string | undefined) ||
            user.email ||
            "User",
          email: user.email,
          role: profileRole,
          phone: profile?.phone ?? null,
        } as any;
      },
    }),
    Credentials({
      id: "cleaner-phone",
      name: "Cleaner Phone Login",
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null;
        const phone = credentials.phone as string | undefined;
        const password = credentials.password as string | undefined;
        if (!phone || !password) return null;

        const { data: profile, error: profileError } = await supabaseService
          .from("profiles")
          .select("id, name, email, phone, role")
          .eq("phone", phone)
          .eq("role", "cleaner")
          .maybeSingle();

        if (profileError || !profile || !profile.email) {
          return null;
        }

        const { data, error } = await supabaseAuth.auth.signInWithPassword({
          email: profile.email as string,
          password,
        });

        if (error || !data?.user) {
          return null;
        }

        const user = data.user;

        return {
          id: user.id,
          name:
            (profile.name && String(profile.name).trim()) ||
            (user.user_metadata?.name as string | undefined) ||
            profile.email ||
            "Cleaner",
          email: profile.email,
          role: "cleaner" as Role,
          phone: profile.phone ?? phone,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
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
};

