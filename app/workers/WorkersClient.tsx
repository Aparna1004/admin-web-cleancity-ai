"use client";

import { useState } from "react";
import { WorkerCard } from "../../components/WorkerCard";

export type WorkerRow = {
  id: string;
  active: boolean | null;
  zone?: string | null;
  profiles?: { full_name: string | null } | null;
};

export function WorkersClient({ workers = [] as WorkerRow[] }: { workers?: WorkerRow[] }) {
  const safeWorkers = workers || [];
  const [selected, setSelected] = useState<WorkerRow | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {safeWorkers.map((worker) => (
          <WorkerCard
            key={worker.id}
            worker={{
              id: worker.id,
              name: worker.profiles?.full_name || "Worker",
              zone: worker.zone || "Unknown",
              totalCleanups: 0,
              status: worker.active ? "Online" : "Offline",
            }}
            onAssign={() => setSelected(worker)}
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
              <label className="text-sm font-semibold text-slate-700">Route ID</label>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                placeholder="e.g. R-401"
              />
              <label className="text-sm font-semibold text-slate-700">Notes</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-indigo-500 focus:outline-none"
                rows={3}
                placeholder="Add dispatch instructions"
              />
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



