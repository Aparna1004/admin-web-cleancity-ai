import Link from "next/link";
import { AppShell } from "../../../components/AppShell";
import { getSupabaseServiceClient } from "../../../lib/supabaseServer";

type RouteDetails = {
  id: string;
  name: string;
  zone: number | null;
  stop_names?: string[];
  google_maps_url: string | null;
  status: string;
};

export default async function RouteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = getSupabaseServiceClient();

  let route: RouteDetails | null = null;
  try {
    const { data, error } = await supabase
      .from("routes")
      .select("id, name, area_id, stop_names, google_maps_url, status")
      .eq("id", params.id)
      .maybeSingle();

    if (error) {
      // Avoid crashing if relations/columns are missing; fall back to not-found UI.
      console.error("[routes/:id] Supabase error", error);
    } else if (data) {
      route = {
        id: String(data.id),
        name: data.name ?? `Route-${String(data.id).slice(0, 6)}`,
        zone: data.area_id ?? null,
        stop_names: data.stop_names ?? [],
        google_maps_url: data.google_maps_url ?? null,
        status: data.status ?? "pending",
      };
    }
  } catch (e) {
    console.error("[routes/:id] Supabase fetch threw", e);
  }

  if (!route) {
    return (
      <AppShell>
        <div className="rounded-xl border bg-white p-6">
          <p>Route not found</p>
          <Link href="/routes">Back</Link>
        </div>
      </AppShell>
    );
  }

  /* Convert Google Maps URL → Embed URL */
  const focusLocation =
  route.stop_names && route.stop_names.length > 0
    ? route.stop_names[0]
    : "India";

  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(
    focusLocation
  )}&z=14&output=embed`;


  return (
    <AppShell>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP SECTION */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold">{route.name}</h2>
              <p className="text-sm text-slate-600">
                Zone {route.zone ?? "N/A"} • {(route.stop_names ?? []).length} checkpoints
              </p>
            </div>

            <a
              href={route.google_maps_url ?? "#"}
              target={route.google_maps_url ? "_blank" : undefined}
              className={route.google_maps_url ? "bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm" : "bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm"}
              rel="noreferrer"
            >
              Open in Maps
            </a>

          </div>

          {/* ALWAYS SHOW MAP */}
          <div className="h-[360px] rounded-lg overflow-hidden border">
            <iframe
              src={embedUrl}
              width="100%"
              height="100%"
              className="border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />


          </div>
        </div>

        {/* STOPS / CHECKPOINTS */}
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Checkpoints</h3>

          {(route.stop_names ?? []).length === 0 ? (
            <p className="text-slate-500 text-sm text-center">
              No checkpoints defined
            </p>
          ) : (
            <div className="space-y-3">
              {(route.stop_names ?? []).map((name, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 border rounded-lg p-3"
                >
                  <div className="h-6 w-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">
                      Visit checkpoint {index + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
