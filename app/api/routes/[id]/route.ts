import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { supabase, appUser } = await getAuthAndUser(request);
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, worker_id, date, status, report_ids } = body as {
    name?: string;
    worker_id?: string | null;
    date?: string;
    status?: 'planned' | 'in_progress' | 'completed';
    report_ids?: string[];
  };

  // Admin can update all; worker can update status only
  const update: any = {};
  if (ensureRole(appUser, ['admin'])) {
    if (typeof name === 'string') update.name = name;
    if (typeof worker_id !== 'undefined') update.worker_id = worker_id;
    if (typeof date === 'string') update.date = date;
  }
  if (status) update.status = status;

  if (Object.keys(update).length > 0) {
    const { error } = await supabase.from('routes').update(update).eq('id', params.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (ensureRole(appUser, ['admin']) && Array.isArray(report_ids)) {
    // reset assignments then add provided
    const { error: delError } = await supabase.from('route_reports').delete().eq('route_id', params.id);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 400 });
    }
    if (report_ids.length > 0) {
      const rows = report_ids.map((rid) => ({ route_id: params.id, report_id: rid }));
      const { error: insError } = await supabase.from('route_reports').insert(rows);
      if (insError) {
        return NextResponse.json({ error: insError.message }, { status: 400 });
      }
    }
  }

  const { data, error: fetchError } = await supabase
    .from('routes')
    .select('*, route_reports (report_id), worker:worker_id (id, user_id)')
    .eq('id', params.id)
    .single();
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 400 });
  }
  return NextResponse.json({ route: data });
}


