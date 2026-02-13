"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "../../../lib/supabaseClient";

export default function OAuthExchangePage() {
  return (
    <Suspense fallback={null}>
      <OAuthExchangeContent />
    </Suspense>
  );
}

function OAuthExchangeContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function run() {
      await supabaseClient.auth.exchangeCodeForSession(window.location.href);
      const redirect = params.get("redirect") || "/dashboard";
      router.replace(redirect);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}




