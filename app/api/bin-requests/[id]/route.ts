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
      const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

      const isAdminOrWorker =
        (user?.user_metadata?.role ?? "") === "admin" ||
        (user?.user_metadata?.role ?? "") === "worker" ||
        (!user && hasServiceRole);

      if (!user && !hasServiceRole) {
        return NextResponse.json(
          { error: authError ?? "Unauthorized" },
          { status: 401 }
        );
      }

      if (!isAdminOrWorker) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const body = (await req.json()) as { status?: string | null };
      const status = body?.status?.toLowerCase().trim();

      const validStatuses = ["requested", "approved", "in_progress", "completed"];

      if (!status || !validStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }

      const supabase = getSupabaseServiceClient();

      const { data, error } = await supabase
        .from("bin_requests")
        .update({ status })
        .eq("id", params.id)
        .select()
        .maybeSingle(); // ✅ v2 safe

      if (error) {
        console.error("[bin-requests/:id:PATCH] Supabase error", error);
        return NextResponse.json(
          { error: "Failed to update bin request" },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(data, { status: 200 });
    } catch (err) {
      console.error("[bin-requests/:id:PATCH] Unexpected error", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }


// DELETE /api/bin-requests/:id
// Deletes a bin request (admin/worker or service role)
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { user, error: authError } = await getUserFromRequest(req);
    const hasServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

    const isAdminOrWorker =
      (user?.user_metadata?.role ?? "") === "admin" ||
      (user?.user_metadata?.role ?? "") === "worker" ||
      (!user && hasServiceRole); // allow server-side service role fallback

    if (!user && !hasServiceRole) {
      return NextResponse.json({ error: authError ?? "Unauthorized" }, { status: 401 });
    }
    if (!isAdminOrWorker) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getSupabaseServiceClient();
    const { error } = await supabase
      .from("bin_requests")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("[bin-requests/:id:DELETE] Supabase error deleting bin request", error);
      // Check for RLS error (42501) or permission denied
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("RLS")) {
        console.error("[bin-requests/:id:DELETE] RLS error - SERVICE_ROLE_KEY may not be configured correctly");
        return NextResponse.json({ error: "Permission denied. Check RLS policies or SERVICE_ROLE_KEY configuration." }, { status: 403 });
      }
      // Check for 404 - not found
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ error: "Failed to delete bin request" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("[bin-requests/:id:DELETE] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

