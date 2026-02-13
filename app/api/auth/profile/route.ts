import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../lib/supabaseServer";

// GET /api/auth/profile
// Returns the row from public.users associated with the authenticated user.
export async function GET(req: Request) {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error: dbError } = await supabase.from("users").select("*").eq("id", user.id).single();

    if (dbError) {
      console.error("[auth/profile:GET] Supabase error fetching profile", dbError);
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[auth/profile:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/auth/profile
// Body may contain { name?: string, phone?: string }
export async function PATCH(req: Request) {
  try {
    const { user, error } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: error ?? "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as { name?: string; phone?: string };
    const update: { name?: string; phone?: string } = {};

    if (body.name && typeof body.name === "string") {
      update.name = body.name;
    }
    if (body.phone && typeof body.phone === "string") {
      update.phone = body.phone;
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error: dbError } = await supabase
      .from("users")
      .update(update)
      .eq("id", user.id)
      .select()
      .single();

    if (dbError) {
      console.error("[auth/profile:PATCH] Supabase error updating profile", dbError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[auth/profile:PATCH] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


