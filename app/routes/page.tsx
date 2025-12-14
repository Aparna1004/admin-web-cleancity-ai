import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { routes } from "../../lib/mockRoutes";

type RouteRow = { id: string; name: string | null; zone: string | null; stops: any[] | null };
type WorkerRow = { id: string; current_route_id: string | null; profiles?: { full_name: string | null } | null };

export default async function RoutesPage() {
  const routesData = routes as unknown as RouteRow[];

  return (
    <AppShell>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Routes</h2>
          <span className="text-sm text-slate-600">{routes.length} active</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Route</th>
              <th className="px-5 py-3">Zone</th>
              <th className="px-5 py-3">Stops</th>
              <th className="px-5 py-3">Worker</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {routesData.map((route: RouteRow) => {
              const workerName = "Unassigned";
              return (
                <tr key={route.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">{route.name || route.id}</td>
                  <td className="px-5 py-3 text-slate-700">{route.zone || "—"}</td>
                  <td className="px-5 py-3 text-slate-700">{route.stops?.length ?? 0}</td>
                  <td className="px-5 py-3 text-slate-700">{workerName}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/routes/${route.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      View Route
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}


