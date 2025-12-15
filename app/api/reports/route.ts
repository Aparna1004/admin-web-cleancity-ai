import { NextResponse } from 'next/server';
import { getAuthAndUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const supabase = createSupabaseServer(request);
  const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ reports: data ?? [] });
}

export async function POST(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Debug: ensure auth.uid will be available in SQL
  console.log('[api/reports POST] auth user', authUser.id);
  const supabase = createSupabaseServer(request);
  const body = await request.json().catch(() => ({}));
  const { description, image_url, latitude, longitude, address, severity } = body as {
    description: string;
    image_url?: string;
    latitude: number;
    longitude: number;
    address?: string;
    severity?: 'low' | 'medium' | 'high';
  };
  if (!description || typeof description !== 'string') {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 });
  }
  const payload = {
    description: description.trim(),
    image_url: image_url ?? null,
    latitude,
    longitude,
    address: address ?? null,
    severity: severity ?? 'medium',
    status: 'pending' as const,
  };
  const { data, error } = await supabase.from('reports').insert(payload).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ report: data }, { status: 201 });
}


