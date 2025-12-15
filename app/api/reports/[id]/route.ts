import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { authUser } = await getAuthAndUser(req);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createSupabaseServer(req);
  const { data, error } = await supabase.from('reports').select('*').eq('id', params.id).single();
  if (error?.code === 'PGRST116') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ report: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { supabase, appUser, authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  console.log('[api/reports PATCH] auth user', authUser.id);
  const body = await request.json().catch(() => ({}));
  const { status, address, severity, image_url, description } = body as {
    status?: 'pending' | 'assigned' | 'cleaned';
    address?: string | null;
    severity?: 'low' | 'medium' | 'high';
    image_url?: string | null;
    description?: string;
  };

  // Allow admin full, worker limited (status update), citizen no updates.
  if (!ensureRole(appUser, ['admin', 'worker'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const update: any = {};
  if (status) update.status = status;
  if (ensureRole(appUser, ['admin'])) {
    if (typeof address !== 'undefined') update.address = address;
    if (severity) update.severity = severity;
    if (typeof image_url !== 'undefined') update.image_url = image_url;
    if (typeof description === 'string') update.description = description.trim();
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No changes' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('reports')
    .update(update)
    .eq('id', params.id)
    .select('*')
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Audit log for admin updates
  if (ensureRole(appUser, ['admin'])) {
    await supabase.from('audit_logs').insert({
      admin_id: authUser.id,
      action: `Updated report ${params.id} with ${JSON.stringify(update)}`,
    });
  }

  return NextResponse.json({ report: data });
}


