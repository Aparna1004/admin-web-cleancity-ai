"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";

export default function OAuthExchangePage() {
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



