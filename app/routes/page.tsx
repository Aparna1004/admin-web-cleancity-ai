import Link from "next/link";
import { AppShell } from "../../components/AppShell";

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
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/routes`,
    { cache: "no-store" }
  );

  let routesData: RouteData[] = [];
  let errorMessage: string | null = null;

  if (res.ok) {
    routesData = await res.json();
  } else {
    const errorData = await res.json().catch(() => ({}));
    errorMessage = errorData.error || "Failed to load routes";
  }

  return (
    <AppShell>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Routes</h2>
            {!errorMessage && (
              <span className="text-sm text-slate-600">
                {routesData.length} active
              </span>
            )}
          </div>

          {/* CREATE ROUTES BUTTON */}
          <form
            action={async () => {
              "use server";
              await fetch(
                `${process.env.NEXT_PUBLIC_ROUTING_SERVICE_URL}/routes/create`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    date: new Date().toISOString().slice(0, 10),
                  }),
                }
              );
            }}
          >
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Create Routes
            </button>
          </form>
        </div>

        {/* CONTENT */}
        {errorMessage ? (
          <div className="px-5 py-8 text-center">
            <p className="text-slate-700">{errorMessage}</p>
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
                <tr
                  key={route.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {route.name}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {route.zone ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {route.stops}
                  </td>
                  <td className="px-5 py-3 text-slate-700">
                    {route.worker}
                  </td>
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
