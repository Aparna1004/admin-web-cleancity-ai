import { NextResponse } from 'next/server';
import { getAuthAndUser } from '@/lib/auth';
import { createSupabaseServer } from '@/lib/supabase/server';

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }
  const supabase = createSupabaseServer(request);
  const { data, error } = await supabase.from('bin_requests').select('*').order('created_at', { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: CORS_HEADERS });
  }
  return NextResponse.json({ binRequests: data ?? [] }, { headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const { authUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });
  }
  const supabase = createSupabaseServer(request);
  const body = await request.json().catch(() => ({}));
  const { latitude, longitude, address } = body as {
    latitude: number;
    longitude: number;
    address: string;
  };
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !address) {
    return NextResponse.json({ error: 'latitude, longitude, and address are required' }, { status: 400, headers: CORS_HEADERS });
  }
  const payload = {
    user_id: authUser.id,
    latitude,
    longitude,
    address,
    status: 'requested' as const,
  };
  const { data, error } = await supabase.from('bin_requests').insert(payload).select('*').single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400, headers: CORS_HEADERS });
  }
  return NextResponse.json({ binRequest: data }, { status: 201, headers: CORS_HEADERS });
}


