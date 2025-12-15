"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { ReportRow } from "../../components/ReportRow";
import { type ReportStatus } from "../../lib/mockReports";

export type ReportItem = {
  id: string;
  image_url: string | null;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string | null;
  location?: string | null;
};

export function ReportsClient({ reports = [] as ReportItem[] }: { reports?: ReportItem[] }) {
  const safeReports = reports || [];
  const [selected, setSelected] = useState<ReportItem | null>(null);

  const normalizeStatus = (value: string | null): ReportStatus => {
    const normalized = (value || "").toLowerCase();
    switch (normalized) {
      case "new":
      case "open":
        return "New";
      case "in review":
      case "review":
        return "In Review";
      case "dispatched":
      case "assigned":
        return "Dispatched";
      case "closed":
      case "resolved":
        return "Closed";
      default:
        return "New";
    }
  };

  return (
    <AppShell>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
          <span className="text-sm text-slate-600">{safeReports.length} records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="p-3">Image</th>
                <th className="p-3">Location</th>
                <th className="p-3">Severity</th>
                <th className="p-3">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {safeReports.map((report) => (
                <ReportRow
                  key={report.id}
                  report={{
                    id: report.id,
                    image: report.image_url || "/placeholder.png",
                    location: report.location || "Unknown location",
                    severity: (report.severity as any) || "Low",
                    date: report.created_at?.slice(0, 10) || "",
                    status: normalizeStatus(report.status),
                    description: report.description || "",
                  }}
                  onSelect={() => setSelected(report)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">{selected.location || "Report"}</h3>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-700"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Severity: {selected.severity} • Status: {selected.status}
            </p>
            {selected.image_url && (
              <img
                src={selected.image_url}
                alt={selected.location || "Report image"}
                className="mt-4 h-48 w-full rounded-lg object-cover"
              />
            )}
            <p className="mt-3 text-sm text-slate-700">{selected.description}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}



