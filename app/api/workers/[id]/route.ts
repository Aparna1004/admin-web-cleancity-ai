import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabaseServer";

// GET /api/workers/:id
// Returns basic worker information joined with the public.users table.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient();

    const { data: worker, error: workerError } = await supabase
      .from("workers")
      .select("id, user_id, active")
      .eq("id", params.id)
      .single();

    if (workerError) {
      console.error("[workers/:id:GET] Supabase error fetching worker", workerError);
      return NextResponse.json({ error: "Failed to fetch worker" }, { status: 500 });
    }

    if (!worker) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, phone, role")
      .eq("id", worker.user_id)
      .single();

    if (userError) {
      console.error("[workers/:id:GET] Supabase error fetching related user", userError);
    }

    return NextResponse.json(
      {
        ...worker,
        profile: user ?? null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[workers/:id:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


