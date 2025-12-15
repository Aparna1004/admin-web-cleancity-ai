import dynamic from "next/dynamic";
import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { mockRoutes, type RouteStop } from "../../../lib/mockRoutes";

const RouteMap = dynamic(
  () => import("../../../components/RouteMap").then((mod) => mod.RouteMap),
  { ssr: false }
);

export default async function RouteDetailPage({ params }: { params: { id: string } }) {
  const route = mockRoutes.find((r) => r.id === params.id);

  if (!route) {
    return (
      <AppShell>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-slate-800">Route not found.</p>
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

  const stops: RouteStop[] = Array.isArray(route.stops)
    ? route.stops.map((stop) => ({
        ...stop,
        severity: stop.severity ?? "Low",
        status: stop.status ?? "Pending",
      }))
    : [];

  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{`Route ${route.id}`}</h2>
              <p className="text-sm text-slate-600">Zone {route.zone ?? "N/A"} • {stops.length} stops</p>
            </div>
          </div>
          <RouteMap route={{ ...route, stops }} />
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


