import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabaseServer";

// GET /api/routes/:id
// Returns a single route with its basic fields and associated report IDs if available.
// 
// TODO: The routes table must be created in Supabase before this endpoint will work.
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = getSupabaseServiceClient();

    const { data: route, error: routeError } = await supabase
      .from("routes")
      .select("*")
      .eq("id", params.id)
      .single();

    if (routeError) {
      console.error("[routes/:id:GET] Supabase error fetching route", routeError);
      // PGRST205 means table doesn't exist
      if (routeError.code === "PGRST205" || routeError.message?.includes("Could not find the table")) {
        return NextResponse.json(
          { error: "Routes table not created yet. Please create the routes table in Supabase." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: "Failed to fetch route" }, { status: 500 });
    }

    if (!route) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Optionally load linked reports via route_reports join table, if present.
    const { data: links, error: linksError } = await supabase
      .from("route_reports")
      .select("report_id")
      .eq("route_id", params.id);

    if (linksError) {
      console.error("[routes/:id:GET] Supabase error fetching route_reports", linksError);
    }

    return NextResponse.json(
      {
        ...route,
        report_ids: links?.map((l: { report_id: string }) => l.report_id) ?? [],
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[routes/:id:GET] Unexpected error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


