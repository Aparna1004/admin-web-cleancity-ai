"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackContent />
    </Suspense>
  );
}

function AuthCallbackContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function run() {
      // Exchange the code for a session (if present). This handles OAuth.
      const { data, error } = await supabaseClient.auth.exchangeCodeForSession(window.location.href);
      // Ignore error here; user may have already been signed in or using password auth
      const redirect = params.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}




