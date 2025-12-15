import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, appUser } = await getAuthAndUser(request);
  if (!ensureRole(appUser, ['admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { status, address } = body as {
    status?: 'requested' | 'approved' | 'installed';
    address?: string;
  };

  const update: any = {};
  if (status) update.status = status;
  if (typeof address === 'string') update.address = address;
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('bin_requests')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ binRequest: data });
}


