"use client";

import Link from "next/link";
import { Worker } from "../lib/mockWorkers";

export function WorkerCard({ worker, onAssign }: { worker: Worker; onAssign: () => void }) {
  const online = worker.status === "Online";
  const route = worker.assignedRoute;
  const hasActiveRoute = !!route;

  return (
    <div className="flex h-full min-h-[17rem] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex shrink-0 items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">{worker.name}</p>
          <p className="text-sm text-slate-600">Zone {worker.zone}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
          }`}
        >
          {worker.status}
        </span>
      </div>

      <div className="flex min-h-[6.5rem] flex-1 flex-col rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
        <p className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Current route
        </p>
        <div className="mt-1 flex flex-1 flex-col justify-center">
          {route ? (
            <div className="flex flex-col gap-1">
              <Link
                href={`/routes/${route.id}`}
                className="font-medium text-indigo-700 hover:text-indigo-600 hover:underline"
              >
                {route.name || "Route"}
              </Link>
              {route.status ? (
                <span className="text-xs text-slate-600">Status: {route.status}</span>
              ) : null}
            </div>
          ) : (
            <p className="text-slate-600">No route assigned</p>
          )}
        </div>
      </div>

      <div className="mt-auto flex shrink-0 flex-col gap-3">
        <p className="text-sm text-slate-700">Total cleanups: {worker.totalCleanups}</p>
        {hasActiveRoute ? (
          <p className="text-xs text-slate-500">
            Complete this route on the{" "}
            <Link href="/routes" className="font-medium text-indigo-600 hover:underline">
              Routes
            </Link>{" "}
            page before assigning another.
          </p>
        ) : null}
        <button
          type="button"
          onClick={onAssign}
          disabled={hasActiveRoute}
          className="inline-flex justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
        >
          {hasActiveRoute ? "Assign route (locked)" : "Assign route"}
        </button>
      </div>
    </div>
  );
}




