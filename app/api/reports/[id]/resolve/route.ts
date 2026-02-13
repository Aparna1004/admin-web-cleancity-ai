import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "../../../../../lib/supabaseServer";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServiceClient();

    console.log("[resolve] Resolving report:", params.id);

    // 1️⃣ Update report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .update({ status: "resolved" })
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (reportError) {
      console.error(reportError);
      return NextResponse.json(
        { error: "Failed to resolve report" },
        { status: 500 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // 2️⃣ Find route containing this report
    const { data: route } = await supabase
      .from("routes")
      .select("id, report_ids")
      .contains("report_ids", [params.id])
      .maybeSingle();

    if (route && Array.isArray(route.report_ids)) {
      const { data: pendingReports } = await supabase
        .from("reports")
        .select("id")
        .in("id", route.report_ids)
        .neq("status", "resolved");

      if (!pendingReports || pendingReports.length === 0) {
        await supabase
          .from("routes")
          .update({ status: "cleaned", attention: false })
          .eq("id", route.id);
      }
    }

    return NextResponse.json(report, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
