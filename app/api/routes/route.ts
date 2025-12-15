import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createSupabaseServer(request);
  const { data, error } = await supabase
    .from('routes')
    .select('*, route_reports (report_id), worker:worker_id (id, user_id)')
    .order('date', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ routes: data ?? [] });
}

export async function POST(request: Request) {
  const { supabase, appUser } = await getAuthAndUser(request);
  if (!ensureRole(appUser, ['admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, worker_id, date, status, report_ids } = body as {
    name: string;
    worker_id?: string | null;
    date: string; // ISO date
    status?: 'planned' | 'in_progress' | 'completed';
    report_ids?: string[];
  };
  if (!name || !date) {
    return NextResponse.json({ error: 'name and date are required' }, { status: 400 });
  }

  const routePayload: any = {
    name,
    date,
    status: status ?? 'planned',
    worker_id: worker_id ?? null,
  };

  const { data: route, error } = await supabase.from('routes').insert(routePayload).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (Array.isArray(report_ids) && report_ids.length > 0) {
    const rows = report_ids.map((rid) => ({ route_id: route.id, report_id: rid }));
    const { error: rrError } = await supabase.from('route_reports').insert(rows);
    if (rrError) {
      return NextResponse.json({ error: rrError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ route }, { status: 201 });
}


