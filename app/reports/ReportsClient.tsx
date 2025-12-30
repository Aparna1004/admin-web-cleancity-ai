"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "../../components/AppShell";

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

export function ReportsClient({ reports = [] }: { reports?: ReportItem[] }) {
  const router = useRouter();

  const [rows, setRows] = useState<ReportItem[]>(reports);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [severityDraft, setSeverityDraft] = useState("low");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAttentionOnly, setShowAttentionOnly] = useState(true);

  // 🔒 PERMANENT mutation guard (does NOT reset on refresh)
  const processedIds = useRef<Set<string>>(new Set());

  // Sync rows only (DO NOT reset processedIds)
  useEffect(() => {
    setRows(reports ?? []);
  }, [reports]);

  useEffect(() => {
    if (!selected) return;
    const v = (selected.severity || "").toLowerCase();
    setSeverityDraft(v === "low" || v === "medium" || v === "high" ? v : "low");
  }, [selected]);

  const handleDelete = async (id: string) => {
    if (processedIds.current.has(id) || deletingId === id) return;
    if (!window.confirm("Delete this report?")) return;

    processedIds.current.add(id);
    setDeletingId(id);
    setError(null);

    // Optimistic UI
    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelected((s) => (s?.id === id ? null : s));

    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });

      if (res.status === 404) {
        router.refresh();
        return;
      }

      if (!res.ok) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaveSeverity = async () => {
    if (!selected || saving) return;
    if (processedIds.current.has(selected.id)) return;

    processedIds.current.add(selected.id);
    setSaving(true);
    setError(null);

    const uiSeverity =
      severityDraft.charAt(0).toUpperCase() + severityDraft.slice(1);

    // Optimistic UI
    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, severity: uiSeverity } : r
      )
    );
    setSelected({ ...selected, severity: uiSeverity });

    try {
      const res = await fetch(`/api/reports/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: severityDraft }),
      });

      if (res.status === 404) {
        setRows((prev) => prev.filter((r) => r.id !== selected.id));
        setSelected(null);
        router.refresh();
        return;
      }

      if (!res.ok) {
        throw new Error("Update failed");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to update severity");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Reports</h2>
          <label className="flex items-center gap-2 text-sm">
            Attention only
            <input
              type="checkbox"
              checked={showAttentionOnly}
              onChange={(e) => setShowAttentionOnly(e.target.checked)}
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows
            .filter((r) => (showAttentionOnly ? r.attention : true))
            .map((r) => (
              <div key={r.id} className="border rounded-lg p-3">
                <img
                  src={r.image_url || "/placeholder.png"}
                  className="h-40 w-full object-cover rounded"
                />
                <p className="font-semibold mt-2">{r.location}</p>
                <p className="text-xs text-gray-500">
                  {r.created_at?.slice(0, 10)}
                </p>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setSelected(r)}
                    className="flex-1 border rounded px-2 py-1 text-xs"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={processedIds.current.has(r.id)}
                    className="bg-red-100 text-red-700 rounded px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {deletingId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-lg">
            <h3 className="font-bold">{selected.location}</h3>

            <select
              className="w-full border rounded mt-2"
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
              className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded"
            >
              {saving ? "Saving…" : "Save severity"}
            </button>

            <button
              onClick={() => setSelected(null)}
              className="ml-2 border px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
  