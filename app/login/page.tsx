 "use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, ShieldCheck, Smartphone, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";

type RoleTab = "customer" | "admin" | "cleaner";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<RoleTab>(
    (searchParams.get("role") as RoleTab) || "customer",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callbackUrl = searchParams.get("callbackUrl") || undefined;

  async function handleEmailLogin(role: "admin" | "customer") {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("email-credentials", {
        redirect: false,
        email,
        password,
        role,
        callbackUrl: callbackUrl ?? (role === "admin" ? "/admin" : "/customer"),
      });
      if (!res || res.error) {
        setError("Invalid email or password for this role.");
        setLoading(false);
        return;
      }
      router.push(res.url || (role === "admin" ? "/admin" : "/customer"));
    } catch (e) {
      setError("Something went wrong, please try again.");
      setLoading(false);
    }
  }

  async function handleCleanerLogin() {
    setLoading(true);
    setError(null);
    try {
      const res = await signIn("cleaner-phone", {
        redirect: false,
        phone,
        password,
        callbackUrl: callbackUrl ?? "/cleaner",
      });
      if (!res || res.error) {
        setError("Invalid phone or password.");
        setLoading(false);
        return;
      }
      router.push(res.url || "/cleaner");
    } catch (e) {
      setError("Something went wrong, please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full grid md:grid-cols-[1.2fr,1fr] gap-10 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="flex items-center gap-2 mb-6">
            <Image
              src="/logo.png"
              alt="Shalean"
              width={32}
              height={32}
              className="h-8 w-8 object-contain flex-shrink-0"
            />
            <div>
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Shalean Portal
              </p>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                Sign in to your dashboard
              </h1>
            </div>
          </div>

          <div className="inline-flex p-1 bg-slate-100 rounded-full text-xs font-semibold mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("customer")}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === "customer"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Customer
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("admin")}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === "admin"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cleaner")}
              className={`px-3 py-1.5 rounded-full flex items-center gap-1 ${
                activeTab === "cleaner"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Cleaner
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {activeTab === "customer" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleEmailLogin("customer");
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="customer@shalean.test"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="customer123"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  Sign in as Customer
                </button>
                <p className="text-[11px] text-slate-500 text-center">
                  New customer?{" "}
                  <Link href="/signup" className="font-semibold text-blue-600 hover:underline">
                    Create an account
                  </Link>
                </p>
              </div>
            </form>
          )}

          {activeTab === "admin" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleEmailLogin("admin");
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Admin email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="admin@shalean.test"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="admin123"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-950 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Sign in as Admin
              </button>
            </form>
          )}

          {activeTab === "cleaner" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                void handleCleanerLogin();
              }}
            >
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="+27820000001"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    placeholder="Cleaner password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                Sign in as Cleaner
              </button>
            </form>
          )}

          <p className="mt-6 text-[11px] text-slate-500">
            Use the email and password you configured in the admin panel for customers and admins.
            Cleaners should use the phone number and password provided by the admin.
          </p>
        </div>

        <aside className="hidden md:flex flex-col gap-6 bg-slate-950 text-slate-50 p-8 justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">
              Trusted Cape Town Cleaning
            </p>
            <h2 className="text-2xl font-black mb-3">
              One login for customers, cleaners & admin.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Manage bookings, track earnings, and oversee operations in one
              unified Shalean portal, designed for busy Cape Town households and
              teams.
            </p>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-blue-300" />
              <p className="text-slate-300">
                <strong>Customers</strong> can see upcoming cleans, history and
                billing details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <p className="text-slate-300">
                <strong>Cleaners</strong> log in with their phone, view today’s
                jobs and earnings.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <p className="text-slate-300">
                <strong>Admins</strong> oversee performance, revenue and team
                availability.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}

