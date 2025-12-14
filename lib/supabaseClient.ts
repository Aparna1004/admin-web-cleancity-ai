"use client";

// Frontend-only mode: export a stubbed Supabase client so UI can call auth
// methods without hitting the real backend.
type AuthResult = { data: any; error: null };
type SessionResult = { data: { session: null }; error: null };

const stubAuth = {
  signInWithPassword: async (): Promise<AuthResult> => ({ data: null, error: null }),
  signInWithOAuth: async (): Promise<AuthResult> => ({ data: null, error: null }),
  signUp: async (): Promise<AuthResult> => ({ data: null, error: null }),
  signOut: async (): Promise<AuthResult> => ({ data: null, error: null }),
  getSession: async (): Promise<SessionResult> => ({ data: { session: null }, error: null }),
};

export const supabaseClient = { auth: stubAuth } as any;
export const supabaseBrowser = supabaseClient;

export function createSupabaseBrowserClient() {
  return supabaseClient;
}
