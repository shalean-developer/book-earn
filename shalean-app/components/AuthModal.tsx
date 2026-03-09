"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { UserProfile, CleanerProfile, AdminProfile } from "@/lib/dashboard-types";
import { createClient } from "@/lib/supabase/client";
import { getProfileForSession } from "@/app/actions/profile";

type AuthMode = "login" | "signup";

export const AuthModal = ({
  isOpen,
  onClose,
  mode: initialMode,
  onAuthSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthMode;
  onAuthSuccess: (user: UserProfile | CleanerProfile | AdminProfile) => void;
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signupRole, setSignupRole] = useState<"customer" | "cleaner" | "admin">("customer");

  const supabase = createClient();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let session: { access_token: string } | null = null;

      if (mode === "login") {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message === "Invalid login credentials" ? "Invalid email or password." : signInError.message);
          setLoading(false);
          return;
        }
        session = data?.session ?? null;
      } else {
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setLoading(false);
          return;
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: signupRole, name: name.trim() || undefined },
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }
        const { data: { session: signUpSession } } = await supabase.auth.getSession();
        if (!signUpSession) {
          setError("Check your email to confirm your account, then sign in.");
          setLoading(false);
          return;
        }
        session = signUpSession;
      }

      if (!session) {
        const { data: { session: fallback } } = await supabase.auth.getSession();
        session = fallback;
      }

      let profile: UserProfile | CleanerProfile | AdminProfile | null = null;

      if (session?.access_token) {
        const res = await fetch("/api/auth/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ accessToken: session.access_token }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          profile = data.profile ?? null;
          if (!profile && typeof data?.error === "string") {
            setError(data.error);
            setLoading(false);
            return;
          }
        } else if (typeof data?.error === "string") {
          setError(data.error);
          setLoading(false);
          return;
        }
      }
      const token = session?.access_token ?? undefined;
      if (!profile) {
        await new Promise((r) => setTimeout(r, 200));
        profile = await getProfileForSession(token);
      }
      if (!profile) {
        await new Promise((r) => setTimeout(r, 200));
        profile = await getProfileForSession(token);
      }
      if (!profile) {
        await new Promise((r) => setTimeout(r, 500));
        profile = await getProfileForSession(token);
      }
      if (!profile) {
        setError(
          mode === "signup"
            ? "Account created but profile is not ready. Please sign in again."
            : "Profile could not be loaded. Please try again or sign in again."
        );
        setLoading(false);
        return;
      }

      onAuthSuccess(profile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 100 }}
            className="relative w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-6 sm:mb-8">
              <img src="/shalean-logo.png" alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl object-contain shadow-lg shadow-blue-500/20 mb-4 sm:mb-6" />
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                {mode === "login" ? "Welcome Back" : "Join Shalean"}
              </h3>
              <p className="text-slate-500 text-xs sm:text-sm">
                {mode === "login"
                  ? "Manage your bookings and preferences."
                  : "Create an account to track your cleanings."}
              </p>
            </div>

            {mode === "signup" && (
              <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => setSignupRole("customer")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    signupRole === "customer" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  }`}
                >
                  Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole("cleaner")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    signupRole === "cleaner" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  }`}
                >
                  Cleaner
                </button>
                <button
                  type="button"
                  onClick={() => setSignupRole("admin")}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                    signupRole === "admin" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                  }`}
                >
                  Admin
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
                  {error}
                </p>
              )}
              {mode === "signup" && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    Name (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                  />
                </div>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  required
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                ) : mode === "login" ? (
                  "Log in"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
            <p className="text-center text-sm text-slate-500 mt-4">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className="font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
