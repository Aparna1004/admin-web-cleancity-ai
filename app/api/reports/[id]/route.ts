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

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete report" },
        { status: 500 }
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
