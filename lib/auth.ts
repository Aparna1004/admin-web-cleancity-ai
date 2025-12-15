import { createSupabaseServer } from './supabase/server';

export type AppUserRole = 'citizen' | 'worker' | 'admin';

export interface AppUser {
  id: string;
  name: string | null;
  email: string | null;
  role: AppUserRole;
  phone: string | null;
  created_at: string;
}

export async function getAuthAndUser(request?: Request) {
  const supabase = createSupabaseServer(request);
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !authUser) {
    return { supabase, authUser: null as any, appUser: null as any };
  }
  const { data: appUser, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();
  if (userError) {
    return { supabase, authUser, appUser: null as any };
  }
  return { supabase, authUser, appUser: appUser as AppUser };
}

export function ensureRole(appUser: AppUser | null, allowed: AppUserRole[]) {
  if (!appUser) return false;
  return allowed.includes(appUser.role);
}


