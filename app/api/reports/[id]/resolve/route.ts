import { NextResponse } from "next/server";

// Frontend-only mode: stub endpoint.
export async function POST(_: Request, { params }: { params: { id: string } }) {
  return NextResponse.json({ ok: true, id: params.id, stub: true });
}



