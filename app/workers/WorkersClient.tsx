"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkerCard } from "../../components/WorkerCard";

export type WorkerRow = {
  id: string;
  active: boolean | null;
  zone?: string | null;
  profiles?: { full_name: string | null } | null;
  assignedRoute?: { id: string; name: string; status?: string | null } | null;
  /** Completed routes attributed to this worker (see workers page query). */
  totalCleanups?: number;
};

export function WorkersClient({ workers = [] as WorkerRow[] }: { workers?: WorkerRow[] }) {
  const router = useRouter();
  const safeWorkers = workers || [];
  const [selected, setSelected] = useState<WorkerRow | null>(null);
  const [routeId, setRouteId] = useState("");
  const [notes, setNotes] = useState("");
  const [assigning, setAssigning] = useState(false);  
  const [error, setError] = useState<string | null>(null);

  // Fetch available routes when modal opens
  const [availableRoutes, setAvailableRoutes] = useState<Array<{ id: string; name: string }>>([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  useEffect(() => {
    if (!selected) {
      setAvailableRoutes([]);
      setRouteId("");
      return;
    }

    setRoutesLoading(true);
    setRouteId("");
    setError(null);

    // Only routes with no worker; no-store avoids stale lists after assignments.
    fetch(`/api/routes?for_assignment=true&t=${Date.now()}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            data && typeof data === "object" && "error" in data
              ? String((data as { error?: unknown }).error ?? res.statusText)
              : res.statusText;
          setError(msg || `Failed to load routes (${res.status})`);
          setAvailableRoutes([]);
          return;
        }
        return data;
      })
      .then((data) => {
        if (data === undefined || data === null) return;
        if (!Array.isArray(data)) {
          const msg =
            data && typeof data === "object" && "error" in data
              ? String((data as { error?: unknown }).error ?? "")
              : "";
          setError(msg || "Could not load routes for assignment.");
          setAvailableRoutes([]);
          return;
        }
        const stBlocked = (s: unknown) =>
          ["cleaned", "completed", "done", "cancelled", "archived"].includes(
            String(s ?? "").trim().toLowerCase()
          );
        const open = data.filter((r: any) => {
          if (!r || r.id == null) return false;
          const rid = String(r.id).trim();
          if (!rid) return false;
          const wid = r.worker_id;
          const noWorker =
            wid === null ||
            wid === undefined ||
            (typeof wid === "string" && wid.trim() === "");
          if (!noWorker) return false;
          if (stBlocked(r.status)) return false;
          return true;
        });
        const byId = new Map<string, { id: string; name: string }>();
        for (const r of open) {
          const rid = String(r.id).trim();
          byId.set(rid, { id: rid, name: String(r.name || rid) });
        }
        setAvailableRoutes([...byId.values()]);
      })
      .catch(() => setAvailableRoutes([]))
      .finally(() => setRoutesLoading(false));
  }, [selected]);

  const handleAssign = async () => {
    if (!selected || !routeId.trim()) {
      setError("Please select a route");
      return;
    }

    setAssigning(true);
    setError(null);

    try {
      const res = await fetch(`/api/workers/${selected.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route_id: routeId, notes: notes.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to assign route");
        return;
      }

      setSelected(null);
      setRouteId("");
      setNotes("");
      router.refresh();
    } catch (err) {
      console.error("[WorkersClient] Failed to assign route", err);
      setError("Unexpected error while assigning route");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
        {safeWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={{
              id: worker.id,
              name: worker.profiles?.full_name || "Worker",
              zone: worker.zone || "Unknown",
              totalCleanups: worker.totalCleanups ?? 0,
              status: worker.active ? "Online" : "Offline",
              assignedRoute: worker.assignedRoute ?? null,
            }}
            onAssign={() => {
              if (worker.assignedRoute) return;
              setSelected(worker);
            }}
          />
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <h3 className="text-lg font-bold text-slate-900">Assign Route</h3>
            <p className="text-sm text-slate-600 mt-1">
              Assign a route to <span className="font-semibold">{selected.profiles?.full_name || "Worker"}</span>
            </p>
            <div className="mt-4 space-y-3">
              <label className="text-sm font-semibold text-slate-700">Route</label>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                disabled={routesLoading}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none disabled:opacity-60"
              >
                <option value="">
                  {routesLoading ? "Loading routes…" : "Select a route"}
                </option>
                {availableRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name}
                  </option>
                ))}
              </select>
              {!routesLoading && availableRoutes.length === 0 && (
                <p className="text-xs text-slate-500">
                  No unassigned routes right now. Create routes or wait until one is unassigned.
                </p>
              )}
              <label className="text-sm font-semibold text-slate-700">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                rows={3}
                placeholder="Add dispatch instructions"
              />
              {error && <p className="text-sm text-rose-600">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setSelected(null);
                  setRouteId("");
                  setNotes("");
                  setError(null);
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={assigning || !routeId.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



