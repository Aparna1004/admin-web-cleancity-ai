import { NextResponse } from "next/server";
import { getSupabaseServiceClient, getUserFromRequest } from "../../../../../lib/supabaseServer";

// POST /api/reports/:id/resolve
// Body (optional): { status?: string }
// If status is omitted, the report status will be set to "resolved".
export async function POST(req: Request, { params }: { params: { id: string } }) {
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

    let status = "resolved";
    try {
      const body = (await req.json()) as { status?: string } | null;
      if (body && typeof body.status === "string" && body.status.trim()) {
        status = body.status.trim();
      }
    } catch {
      // No JSON body or invalid JSON – fall back to default status.
    }

    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("[reports/:id/resolve:POST] Supabase error updating report", error);
      return NextResponse.json({ error: "Failed to resolve report" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[reports/:id/resolve:POST] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}