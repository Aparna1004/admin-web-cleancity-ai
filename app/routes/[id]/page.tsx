import dynamic from "next/dynamic";
import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";

const RouteMap = dynamic(
  () => import("../../../components/RouteMap").then((mod) => mod.RouteMap),
  { ssr: false }
);

type RouteStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: "Low" | "Medium" | "High";
  status: "Pending" | "Done";
  afterImage?: string;
};

export default async function RouteDetailPage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServiceClient();

  const { data: route, error: routeError } = await supabase
    .from("routes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (routeError || !route) {
    const isTableMissing = routeError?.code === "PGRST205" || routeError?.message?.includes("Could not find the table");
    
    return (
      <AppShell>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-800 mb-2">
            {isTableMissing 
              ? "Routes table not created yet. Please create the routes table in Supabase."
              : "Route not found."}
          </p>
          <Link
            href="/routes"
            className="mt-4 inline-flex rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Back to routes
          </Link>
        </div>
      </AppShell>
    );
  }

  // Fetch reports linked to this route
  const { data: routeReports } = await supabase
    .from("route_reports")
    .select("report_id")
    .eq("route_id", params.id);

  const reportIds = routeReports?.map((rr: any) => rr.report_id) ?? [];

  let stops: RouteStop[] = [];

  if (reportIds.length) {
    const { data: reports } = await supabase
      .from("reports")
      .select("id, address, latitude, longitude, severity, status")
      .in("id", reportIds);

    if (Array.isArray(reports)) {
      stops = reports.map((r: any, idx: number) => ({
        id: r.id || `stop-${idx}`,
        name: r.address || "Unknown location",
        lat: r.latitude ?? 0,
        lng: r.longitude ?? 0,
        severity: (r.severity?.charAt(0).toUpperCase() + r.severity?.slice(1).toLowerCase()) as "Low" | "Medium" | "High" || "Low",
        status: (r.status === "resolved" || r.status === "closed" ? "Done" : "Pending") as "Pending" | "Done",
      }));
    }
  }

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{route.name || `Route ${route.id}`}</h2>
              <p className="text-sm text-slate-600">Zone {route.zone ?? "N/A"} • {stops.length} stops</p>
            </div>
          </div>
          {stops.length > 0 ? (
            <RouteMap route={{ id: route.id, zone: route.zone ?? "", stops } as any} />
          ) : (
            <div className="h-[360px] flex items-center justify-center text-slate-500">
              No stops assigned to this route
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Stops</h3>
          <div className="mt-3 space-y-3">
            {stops.map((stop) => (
              <div
                key={stop.id}
                className="rounded-lg border border-slate-200 p-3 hover:border-indigo-200"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{stop.name}</p>
                  <StatusBadge status={stop.status ?? "Pending"} />
                </div>
                <p className="text-xs text-slate-600">
                  {stop.lat?.toFixed(4)}, {stop.lng?.toFixed(4)} • Severity {stop.severity ?? "n/a"}
                </p>
                {stop.afterImage && (
                  <img
                    src={stop.afterImage}
                    alt={stop.name}
                    className="mt-2 h-24 w-full rounded-md object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status?.toLowerCase() === "done"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${styles}`}>{status}</span>;
}


