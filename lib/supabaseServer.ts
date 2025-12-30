import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error(
      "Supabase URL is not configured. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in your environment."
    );
  }

  const key = SERVICE_ROLE_KEY || ANON_KEY;
  if (!key) {
    throw new Error(
      "Supabase key is not configured. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  if (!SERVICE_ROLE_KEY) {
    // eslint-disable-next-line no-console
    console.warn(
      "[supabaseServer] Using anon key for server client. Ensure RLS allows required operations, or configure SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
      },
    });
  }

  return serviceClient;
}

export type AuthenticatedUser = User & {
  user_metadata: {
    role?: "admin" | "worker" | "citizen" | string;
    [key: string]: any;
  };
};

export async function getUserFromRequest(req: Request): Promise<{
  user: AuthenticatedUser | null;
  accessToken: string | null;
  error: string | null;
}> {
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { user: null, accessToken: null, error: "Missing or invalid Authorization header" };
  }

  const accessToken = authHeader.slice("bearer ".length).trim();
  if (!accessToken) {
    return { user: null, accessToken: null, error: "Missing access token" };
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user) {
    return { user: null, accessToken, error: error?.message ?? "Invalid or expired token" };
  }

  return {
    user: data.user as AuthenticatedUser,
    accessToken,
    error: null,
  };
}

export function getSupabaseServiceClient() {
  return getServiceClient();
}

