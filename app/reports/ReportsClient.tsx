"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";
import { type ReportStatus } from "../../lib/mockReports";

export type ReportItem = {
  id: string;
  image_url: string | null;
  description: string | null;
  severity: string | null;
  status: string | null;
  created_at: string | null;
  location?: string | null;
  attention?: boolean;
};

export function ReportsClient({ reports = [] as ReportItem[] }: { reports?: ReportItem[] }) {
  const router = useRouter();
  const safeReports = reports || [];
  const [rows, setRows] = useState<ReportItem[]>(safeReports);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [severityDraft, setSeverityDraft] = useState<string>("low");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAttentionOnly, setShowAttentionOnly] = useState(true);

  // Sync local state with props when reports change (e.g., after page refresh)
  useEffect(() => {
    setRows(safeReports);
  }, [safeReports]);

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

  useEffect(() => {
    if (!selected) return;
    const normalized = (selected.severity || "").toLowerCase();
    if (normalized === "high" || normalized === "medium" || normalized === "low") {
      setSeverityDraft(normalized);
    } else {
      setSeverityDraft("low");
    }
  }, [selected]);

  const handleSaveSeverity = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: severityDraft }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update severity");
        return;
      }

      // Update local state so the table reflects the new severity.
      const uiSeverity = severityDraft.charAt(0).toUpperCase() + severityDraft.slice(1);
      setRows((prev) =>
        prev.map((r) => (r.id === selected.id ? { ...r, severity: uiSeverity } : r))
      );
      setSelected((prev) => (prev ? { ...prev, severity: uiSeverity } : prev));
    } catch (err) {
      console.error("[ReportsClient] Failed to update severity", err);
      setError("Unexpected error while updating severity");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this report? This action cannot be undone.")) return;

    setDeletingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete report");
        if (res.status === 404) {
          // Stale card: remove locally so UI reflects DB.
          setRows((prev) => prev.filter((r) => r.id !== id));
          setSelected((prev) => (prev && prev.id === id ? null : prev));
        }
        return;
      }

      setRows((prev) => prev.filter((r) => r.id !== id));
      setSelected((prev) => (prev && prev.id === id ? null : prev));
      // Force refresh server data to ensure UI matches database
      router.refresh();
    } catch (err) {
      console.error("[ReportsClient] Failed to delete report", err);
      setError("Unexpected error while deleting report");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Reports</h2>
            <span className="text-sm text-slate-600">{rows.length} records</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-700 font-semibold">Attention only</label>
            <input
              type="checkbox"
              checked={showAttentionOnly}
              onChange={(e) => setShowAttentionOnly(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows
            .filter((report) => (showAttentionOnly ? report.attention : true))
            .map((report) => (
            <div
              key={report.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="h-40 w-full overflow-hidden bg-slate-100">
                <img
                  src={report.image_url || "/placeholder.png"}
                  alt={report.location || "Report image"}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col px-4 py-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 line-clamp-2">
                      {report.location || "Unknown location"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {report.created_at?.slice(0, 10) || ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {normalizeStatus(report.status)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    Severity: {report.severity || "Low"}
                  </span>
                </div>
                {report.description && (
                  <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelected(report)}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(report.id)}
                    disabled={deletingId === report.id}
                    className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-70"
                  >
                    {deletingId === report.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
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

            <div className="mt-4 space-y-2">
              <label className="text-sm font-semibold text-slate-700">Set severity</label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                value={severityDraft}
                onChange={(e) => setSeverityDraft(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                onClick={handleSaveSeverity}
                disabled={saving}
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-70"
              >
                {saving ? "Saving…" : "Save severity"}
              </button>
              {error && <p className="text-sm text-rose-600 mt-1">{error}</p>}
            </div>
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



