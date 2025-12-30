import { ReportsClient, type ReportItem } from "./ReportsClient";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("reports")
    .select("id, image_url, description, severity, status, created_at, address, attention")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[ReportsPage] Failed to fetch reports", error);
  }

  const rows = Array.isArray(data) ? data : [];

  const reports: ReportItem[] = rows.map((r: any) => ({
    id: r.id,
    image_url: r.image_url ?? null,
    description: r.description ?? null,
    // DB stores severity as 'low' | 'medium' | 'high'; normalize to title case for UI.
    severity:
      typeof r.severity === "string"
        ? r.severity.charAt(0).toUpperCase() + r.severity.slice(1).toLowerCase()
        : "Low",
    status: r.status ?? "new",
    created_at: r.created_at ?? null,
    location: r.address ?? "Unknown location",
    attention: !!r.attention,
  }));

  return <ReportsClient reports={reports} />;
}