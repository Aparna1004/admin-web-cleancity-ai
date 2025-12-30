import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../lib/supabaseServer";

// GET /api/bin-requests/:id
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase.from("bin_requests").select("*").eq("id", params.id).single();

    if (error) {
      console.error("[bin-requests/:id:GET] Supabase error", error);
      return NextResponse.json({ error: "Failed to fetch bin request" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[bin-requests/:id:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/bin-requests/:id
// Body: { status?: string }
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }

    const role = (user.user_metadata?.role ?? "").toString();
    const isAdminOrWorker = role === "admin" || role === "worker";
    if (!isAdminOrWorker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as { status?: string | null };
    const { status } = body;

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Missing or invalid status" }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("bin_requests")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("[bin-requests/:id:PATCH] Supabase error updating bin request", error);
      return NextResponse.json({ error: "Failed to update bin request" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[bin-requests/:id:PATCH] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


