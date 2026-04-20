"use client";

import { useState, useEffect, useCallback } from "react";
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
  const [routeSummary, setRouteSummary] = useState<{ active: number; unassigned: number }>({
    active: 0,
    unassigned: 0,
  });

  const fetchAvailableRoutes = useCallback(async () => {
    setRoutesLoading(true);
    const stBlocked = (s: unknown) =>
      ["assigned", "cleaned", "completed", "done", "cancelled", "archived"].includes(
        String(s ?? "").trim().toLowerCase()
      );
    const noWorker = (wid: unknown) =>
      wid === null ||
      wid === undefined ||
      (typeof wid === "string" &&
        ["", "null", "undefined"].includes(wid.trim().toLowerCase()));
    const toOptions = (list: any[]) => {
      const open = list.filter((r: any) => {
        if (!r || r.id == null) return false;
        const rid = String(r.id).trim();
        if (!rid) return false;
        if (!noWorker(r.worker_id)) return false;
        if (stBlocked(r.status)) return false;
        return true;
      });
      const byId = new Map<string, { id: string; name: string }>();
      for (const r of open) {
        const rid = String(r.id).trim();
        byId.set(rid, { id: rid, name: String(r.name || rid) });
      }
      return [...byId.values()];
    };

    try {
      // Single source of truth for modal consistency.
      const res = await fetch(`/api/routes?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          data && typeof data === "object" && "error" in data
            ? String((data as { error?: unknown }).error ?? res.statusText)
            : res.statusText;
        setError(msg || `Failed to load routes (${res.status})`);
        setAvailableRoutes([]);
        setRouteSummary({ active: 0, unassigned: 0 });
        return;
      }
      if (!Array.isArray(data)) {
        setAvailableRoutes([]);
        setRouteSummary({ active: 0, unassigned: 0 });
        return;
      }
      const activeList = data.filter((r: any) => !stBlocked(r?.status));
      const unassigned = toOptions(activeList);
      console.log("[WorkersClient] Assign popup route counts", {
        activeRoutes: activeList.length,
        unassignedRoutes: unassigned.length,
      });
      setAvailableRoutes(unassigned);
      setRouteSummary({
        active: activeList.length,
        unassigned: unassigned.length,
      });
    } catch {
      setAvailableRoutes([]);
      setRouteSummary({ active: 0, unassigned: 0 });
    } finally {
      setRoutesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selected) {
      setAvailableRoutes([]);
      setRouteId("");
      return;
    }

    setRouteId("");
    setError(null);
    void fetchAvailableRoutes();
  }, [selected, fetchAvailableRoutes]);

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
        // Keep options consistent if backend already changed route state.
        await fetchAvailableRoutes();
        return;
      }

      // After assigning one route, immediately refetch so assigned route disappears.
      await fetchAvailableRoutes();

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
                  {routeSummary.active > 0
                    ? "All active routes are already assigned. Complete/unassign one to reassign."
                    : "No active routes right now. Create routes first."}
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



