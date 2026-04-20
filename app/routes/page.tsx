import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { BrowserDebugLog } from "../../components/BrowserDebugLog";
import { CreateRoutesForm } from "./CreateRoutesForm";
import { dbg, dbgErr } from "../../lib/debugLog";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";
import { CompleteRouteButton } from "./CompleteRouteButton";

type RouteData = {
  id: string;
  batchLabel: string;
  date?: string;
  area_id?: number | null;
  report_ids?: string[];
  google_maps_url?: string | null;
  total_severity?: number;
  status?: string | null;
  worker_id?: string | null;
};

/** Hide finished routes even if the DB filter misses (enum casing / legacy values). */
function isActiveRouteRow(status: unknown): boolean {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  return ["pending", "assigned", "in_progress", "planned", "open", "new"].includes(s);
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function RoutesPage() {
  /* ================= FETCH ROUTES DIRECTLY FROM SUPABASE ================= */
  const supabase = getSupabaseServiceClient();

  let routesData: RouteData[] = [];
  let errorMessage: string | null = null;

  try {
    const { data, error } = await supabase
      .from("routes")
      .select(
        "id, name, area_id, report_ids, google_maps_url, worker_id, status, date, created_at"
      )
      .neq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      errorMessage = error.message ?? "Failed to load routes";
      dbgErr("RoutesPage", "supabase routes error", error);
    } else {
      routesData = (data ?? [])
        .filter((r: any) => isActiveRouteRow(r.status))
        .map((r: any, index: number) => ({
          id: String(r.id),
          batchLabel: `Batch ${index + 1}`,
          area_id: r.area_id ?? null,
          report_ids: r.report_ids ?? [],
          google_maps_url: r.google_maps_url ?? null,
          total_severity: 0,
          status: r.status ?? "pending",
          worker_id: r.worker_id ?? null,
        }));
      const unassignedCount = routesData.filter(
        (r) =>
          r.worker_id == null ||
          (typeof r.worker_id === "string" &&
            ["", "null", "undefined"].includes(r.worker_id.trim().toLowerCase()))
      ).length;
      console.log("[RoutesPage] Unassigned route count", {
        activeRoutes: routesData.length,
        unassignedRoutes: unassignedCount,
      });
      dbg("RoutesPage", "routes loaded", { count: routesData.length });
    }
  } catch (e) {
    dbgErr("RoutesPage", "supabase routes fetch threw", e);
    errorMessage = "Failed to load routes.";
  }

  /* ================= UI ================= */
  return (
    <AppShell>
      <BrowserDebugLog
        tag="RoutesPage"
        payload={{
          supabase: true,
          routeCount: routesData.length,
          errorMessage,
        }}
      />
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Routes</h2>
            {!errorMessage && (
              <span className="text-sm text-slate-600">
                {routesData.length} total
              </span>
            )}
          </div>
          <CreateRoutesForm />
        </div>

        {/* ================= CONTENT ================= */}
        {errorMessage ? (
          <div className="px-5 py-8 text-center">
            <p className="text-red-600">{errorMessage}</p>
          </div>
        ) : routesData.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500">
            No active routes right now. Click{" "}
            <span className="font-semibold text-slate-700">Create Routes</span> to
            generate new ones.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Batch</th>
                <th className="px-5 py-3">Area</th>
                <th className="px-5 py-3">Stops</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {routesData.map((route) => (
                <tr
                  key={route.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {route.batchLabel}
                  </td>

                  <td className="px-5 py-3 text-slate-700">
                    {route.area_id ?? "—"}
                  </td>

                  <td className="px-5 py-3 text-slate-700">
                    {route.report_ids?.length ?? 0}
                  </td>

                  <td className="px-5 py-3 text-slate-700">
                    {route.total_severity ?? 0}
                  </td>

                  <td className="px-5 py-3 text-slate-700">
                    {route.status ?? "pending"}
                  </td>

                  <td className="px-5 py-3 text-right space-x-2">
                    {route.google_maps_url && (
                      <a
                        href={route.google_maps_url}
                        target="_blank"
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Open Map
                      </a>
                    )}

                    <Link
                      href={`/routes/${route.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      View
                    </Link>

                    <CompleteRouteButton
                      routeId={route.id}
                      status={route.status}
                      workerId={route.worker_id ?? null}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AppShell>
  );
}
