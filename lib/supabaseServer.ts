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

  // CRITICAL: Always prefer SERVICE_ROLE_KEY for API routes to bypass RLS
  // If SERVICE_ROLE_KEY is not set, throw error instead of falling back to ANON_KEY
  // This prevents RLS-related 401 errors in API routes
  if (!SERVICE_ROLE_KEY) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for API routes to bypass RLS. Set SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  if (!serviceClient) {
    serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
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

