import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../lib/supabaseServer";

const supabase = getSupabaseServiceClient();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const { routeId } = await req.json();

    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Completing route:", routeId);

    // 1️⃣ Update route
    const { error: routeError } = await supabase
      .from("routes")
      .update({ status: "completed" })
      .eq("id", routeId);

    if (routeError) {
      console.log("Route update error:", routeError.message);
      return NextResponse.json(
        { error: routeError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // 2️⃣ Call RPC to update reports
    const { error: reportError } = await supabase.rpc(
      "complete_route_reports",
      { route_id_input: routeId }
    );

    if (reportError) {
      console.log("Report update error:", reportError.message);
      return NextResponse.json(
        { error: reportError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );

  } catch (err) {
    console.log("Unexpected error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
