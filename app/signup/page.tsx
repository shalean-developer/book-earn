"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { User, Smartphone, KeyRound, Loader2, ShieldCheck } from "lucide-react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refParam, setRefParam] = useState<string | null>(null);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && typeof ref === "string") setRefParam(ref.trim());
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          password,
          ...(refParam ? { ref: refParam } : {}),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || "Failed to create account. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/login?role=customer&signup=success");
    } catch (err) {
      setError("Unexpected error. Please try again.");
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
                Create your customer account
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="Jane Customer"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Mobile number (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="+2782..."
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
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
                Create customer account
              </button>
              <p className="text-[11px] text-slate-500 text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>

          <p className="mt-6 text-[11px] text-slate-500">
            We&apos;ll create a Shalean customer profile linked to your email so you can book and
            manage cleans, track history, and keep your details up to date.
          </p>
        </div>

        <aside className="hidden md:flex flex-col gap-6 bg-slate-950 text-slate-50 p-8 justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-[0.2em] mb-4">
              Trusted Cape Town Cleaning
            </p>
            <h2 className="text-2xl font-black mb-3">
              Join Shalean as a customer.
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Create an account to book regular or once-off cleans, see your upcoming visits and
              history, and keep your contact details in sync with your cleaner and admin team.
            </p>
          </div>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-blue-300" />
              <p className="text-slate-300">
                <strong>Customers</strong> get one place to manage bookings, payments and contact
                details.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Smartphone className="w-4 h-4 text-emerald-300" />
              <p className="text-slate-300">
                <strong>Cleaners</strong> see today&apos;s jobs and earnings as soon as you book.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <p className="text-slate-300">
                <strong>Admins</strong> keep operations running smoothly behind the scenes.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
          <div className="max-w-4xl w-full grid md:grid-cols-[1.2fr,1fr] gap-10 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-10 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          </div>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

