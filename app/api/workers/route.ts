import { NextResponse } from 'next/server';
import { getAuthAndUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createSupabaseServer(request);
  const { data, error } = await supabase.from('workers').select('*, user:users!workers_user_id_fkey(*)');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ workers: data ?? [] });
}


