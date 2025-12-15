"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/dashboard";
  const [error, setError] = useState("");
  const [message, setMessage] = useState("Signup is disabled. Ask an admin to create your account.");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-6">
          <p className="text-xs uppercase text-slate-500 font-semibold">CleanCity Admin</p>
          <h1 className="text-2xl font-bold text-slate-900">Create account</h1>
          <p className="text-sm text-slate-600 mt-1">Sign up to access the dashboard</p>
        </div>

        <p className="text-sm text-slate-700">{message}</p>
        <form className="space-y-4 mt-4" onSubmit={handleSubmit}>
          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500"
          >
            Go to Login
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <button
            type="button"
            className="text-indigo-600 font-semibold hover:underline"
            onClick={() => router.replace(`/login?redirect=${encodeURIComponent(redirect)}`)}
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}

