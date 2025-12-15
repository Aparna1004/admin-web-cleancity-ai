import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createSupabaseServer(request?: Request) {
  const cookieStore = cookies();
  const authHeader = request?.headers.get('Authorization') || undefined;

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    }
  );
}


