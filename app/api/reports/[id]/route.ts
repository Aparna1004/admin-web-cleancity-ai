import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabaseServer";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { severity } = await req.json();

    if (!severity) {
      return NextResponse.json(
        { error: "Severity is required" },
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
      console.error("Severity update error:", error);
      return NextResponse.json(
        { error: "Failed to update severity" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
