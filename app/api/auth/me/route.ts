import { NextResponse } from 'next/server';
import { getAuthAndUser } from '@/lib/auth';

export async function GET(request: Request) {
  const { authUser, appUser } = await getAuthAndUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    authUser: { id: authUser.id, email: authUser.email },
    appUser,
  });
}


