"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { supabaseClient } from "../../lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    if (params.get("error") === "not_admin") {
      setError("You must be an admin to access this dashboard.");
    }
  }, [params]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Enter email and password to continue.");
      return;
    }

    setLoading(true);

    await supabaseClient.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);
    router.replace(redirect);
  }

  async function handleGoogleSignIn() {
    setError("");
    setOauthLoading(true);

    await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
          redirect
        )}`,
      },
    });

    router.replace(redirect);
    setOauthLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs uppercase text-slate-500 font-semibold">
            CleanCity Admin
          </p>
          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-600 mt-1">
            Access the operations dashboard
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="admin@cleancity.ai"
              required
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500 disabled:opacity-70"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <div className="mt-6 flex items-center space-x-2 text-sm text-slate-500">
          <div className="h-px flex-1 bg-slate-200" />
          <span>or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading}
          className="mt-4 w-full rounded-lg border border-slate-200 px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-70"
        >
          {oauthLoading ? "Redirecting…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
