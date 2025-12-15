import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, appUser } = await getAuthAndUser(request);
  if (!ensureRole(appUser, ['admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { active, user_id } = body as { active?: boolean; user_id?: string };
  const update: any = {};
  if (typeof active === 'boolean') update.active = active;
  if (typeof user_id === 'string') update.user_id = user_id;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }
  const { data, error } = await supabase.from('workers').update(update).eq('id', params.id).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ worker: data });
}


