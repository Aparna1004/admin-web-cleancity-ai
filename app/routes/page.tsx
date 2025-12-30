import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";

type RouteData = {
  id: string;
  name: string;
  zone: string | null;
  stops: number;
  worker: string;
  worker_id: string | null;
  status: string | null;
};

export default async function RoutesPage() {
  const supabase = getSupabaseServiceClient();

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/api/routes`, {
    cache: "no-store",
  });

  let routesData: RouteData[] = [];
  let errorMessage: string | null = null;

  if (res.ok) {
    routesData = await res.json();
  } else {
    const errorData = await res.json().catch(() => ({}));
    errorMessage = errorData.error || "Failed to load routes";
    
    // If routes table doesn't exist, show helpful message
    if (res.status === 404 && errorData.error?.includes("Routes table not created")) {
      errorMessage = "Routes table not created yet. Please create the routes table in Supabase.";
    }
  }

  return (
    <AppShell>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Routes</h2>
          {!errorMessage && <span className="text-sm text-slate-600">{routesData.length} active</span>}
        </div>
        {errorMessage ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-700 mb-2">{errorMessage}</p>
            <p className="text-sm text-slate-500">
              The routes table needs to be created in Supabase before routes can be displayed.
            </p>
          </div>
        ) : routesData.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-500">
            No routes found
          </div>
        ) : (
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
              {routesData.map((route) => (
                <tr key={route.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-5 py-3 font-semibold text-slate-900">{route.name}</td>
                  <td className="px-5 py-3 text-slate-700">{route.zone || "—"}</td>
                  <td className="px-5 py-3 text-slate-700">{route.stops}</td>
                  <td className="px-5 py-3 text-slate-700">{route.worker}</td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/routes/${route.id}`}
                      className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                    >
                      View Route
                    </Link>
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


