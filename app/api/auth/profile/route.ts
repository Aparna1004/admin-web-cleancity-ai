import { NextResponse } from 'next/server';
import { getAuthAndUser, ensureRole } from '@/lib/auth';

export async function POST(request: Request) {
  const { supabase, authUser, appUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const { name, phone, role } = body as {
    name?: string;
    phone?: string;
    role?: 'citizen' | 'worker' | 'admin';
  };

  const payload: any = {};
  if (typeof name === 'string') payload.name = name;
  if (typeof phone === 'string') payload.phone = phone;
  if (role && ensureRole(appUser, ['admin'])) {
    payload.role = role;
  }

  // Ensure a users row exists; if not, insert
  if (!appUser) {
    const insertBody = {
      id: authUser.id,
      email: authUser.email,
      name: payload.name ?? null,
      phone: payload.phone ?? null,
      role: payload.role ?? 'citizen',
    };
    const { data, error } = await supabase.from('users').insert(insertBody).select('*').single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ user: data }, { status: 201 });
  }

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ user: appUser }, { status: 200 });
  }

  const { data, error } = await supabase
    .from('users')
    .update(payload)
    .eq('id', authUser.id)
    .select('*')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data });
}


