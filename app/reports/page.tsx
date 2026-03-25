import { ReportsClient, type ReportItem } from "./ReportsClient";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ReportsPage() {
  // Prevent Next.js from caching this server component between navigations.
  // Without this, deleting reports in Supabase may not reflect immediately on the UI.
  noStore();

  const supabase = getSupabaseServiceClient();

  let data: any[] = [];
  try {
    const { data: fetched, error } = await supabase
      .from("reports")
      .select(
        "id, image_url, description, severity, status, created_at, latitude, longitude, address, attention"
      )
      .order("created_at", { ascending: false });

    data = (fetched ?? []) as any[];
    if (error) {
      console.error("[ReportsPage] Failed to fetch reports", error);
    } else {
      console.log("[ReportsPage] Fetched reports", { count: data.length });
    }
  } catch (e) {
    // Prevent Server Components from crashing at render-time in production.
    console.error("[ReportsPage] Supabase fetch threw", e);
  }

  // Fetch first, then filter in code.
  // This avoids subtle SQL `NULL` behavior with `neq("status", ...)` filters.
  const reports: ReportItem[] = (data ?? [])
    .filter((r: any) => {
      const st = r.status;
      // If status is NULL, treat the row as not an "active/open report".
      // This matches the previous Supabase `neq("status", ...)` behavior and
      // avoids showing dangling rows with NULL status.
      if (typeof st !== "string" || st.trim().length === 0) return false;
      return st !== "assigned" && st !== "cleaned" && st !== "resolved";
    })
    .map((r: any) => ({
      id: String(r.id),
      image_url: r.image_url ?? null,
      description: r.description ?? null,
      severity:
        typeof r.severity === "string"
          ? r.severity.charAt(0).toUpperCase() +
            r.severity.slice(1).toLowerCase()
          : "Low",
      status: (r.status as string | null) ?? "new",
      created_at: r.created_at ?? null,
      location: (() => {
        const addr =
          typeof r.address === "string" ? r.address.trim() : "";
        if (addr) return addr;
        if (r.latitude != null && r.longitude != null) {
          return `${Number(r.latitude).toFixed(4)}, ${Number(r.longitude).toFixed(
            4
          )}`;
        }
        return "Unknown location";
      })(),
      attention: !!r.attention,
    }));

  // console.log("[ReportsPage] Fetched reports", reports);
  return <ReportsClient key={reports.length} reports={reports} />;
}
