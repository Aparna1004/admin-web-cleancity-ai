import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabaseServer";

export const dynamic = "force-dynamic";

// PATCH /api/reports/:id
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { severity } = body;

    if (!severity) {
      return NextResponse.json(
        { error: "Missing severity" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceClient();

    const { data, error } = await supabase
      .from("reports")
      .update({ severity })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      return NextResponse.json(
        { error: "Failed to update severity" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/:id
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();

    // Verify it exists before deleting.
    const { data: existing, error: existingErr } = await supabase
      .from("reports")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();

    if (existingErr) {
      console.error("Delete pre-check error:", existingErr);
      return NextResponse.json(
        { error: "Failed to verify report before deletion" },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const { error: deleteErr } = await supabase
      .from("reports")
      .delete()
      .eq("id", params.id);

    if (deleteErr) {
      console.error("Delete error:", deleteErr);
      return NextResponse.json(
        { error: "Failed to delete report" },
        { status: 500 }
      );
    }

    // Verify deletion persisted (prevents false-200 success).
    const { data: afterDelete, error: afterErr } = await supabase
      .from("reports")
      .select("id")
      .eq("id", params.id)
      .maybeSingle();

    if (afterErr) {
      console.error("Delete post-check error:", afterErr);
      return NextResponse.json(
        { error: "Failed to verify deletion" },
        { status: 500 }
      );
    }

    if (afterDelete) {
      return NextResponse.json(
        { error: "Delete did not persist (row still exists)" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
