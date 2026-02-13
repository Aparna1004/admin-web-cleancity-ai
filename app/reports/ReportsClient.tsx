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
  const [resolving, setResolving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAttentionOnly, setShowAttentionOnly] = useState(false);

  const processedIds = useRef<Set<string>>(new Set());

  /* 🔁 Always sync from server */
  useEffect(() => {
    setRows(reports ?? []);
    processedIds.current.clear();
  }, [reports]);

  useEffect(() => {
    if (!selected) return;
    const v = (selected.severity || "").toLowerCase();
    setSeverityDraft(["low", "medium", "high"].includes(v) ? v : "low");
  }, [selected]);

  /* ================= DELETE ================= */
  const handleDelete = async (id: string) => {
    if (processedIds.current.has(id) || deletingId === id) return;
    if (!window.confirm("Delete this report?")) return;

    processedIds.current.add(id);
    setDeletingId(id);
    setError(null);

    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);

    try {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });

      if (res.status !== 200 && res.status !== 404) {
        throw new Error("Delete failed");
      }

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to delete report");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  /* ================= SEVERITY ================= */
  const handleSaveSeverity = async () => {
    if (!selected || saving || processedIds.current.has(selected.id)) return;

    processedIds.current.add(selected.id);
    setSaving(true);
    setError(null);

    const uiSeverity =
      severityDraft.charAt(0).toUpperCase() + severityDraft.slice(1);

    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, severity: uiSeverity } : r
      )
    );

    try {
      const res = await fetch(`/api/reports/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity: severityDraft }),
      });

      if (!res.ok) throw new Error("Update failed");

      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to update severity");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  /* ================= RESOLVE ================= */
  const handleResolve = async () => {
    if (!selected || resolving || processedIds.current.has(selected.id)) return;

    processedIds.current.add(selected.id);
    setResolving(true);
    setError(null);

    setRows((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, status: "resolved" } : r
      )
    );

    try {
      const res = await fetch(`/api/reports/${selected.id}/resolve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Resolve failed");

      setSelected(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to resolve report");
      router.refresh();
    } finally {
      setResolving(false);
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

        {/* REPORT GRID */}
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

                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500">
                    {r.created_at?.slice(0, 10)} • {r.status}
                  </p>

                  {/* ✅ SEVERITY BADGE RESTORED */}
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full
                      ${
                        r.severity?.toLowerCase() === "high"
                          ? "bg-red-100 text-red-700"
                          : r.severity?.toLowerCase() === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-green-100 text-green-700"
                      }
                    `}
                  >
                    {r.severity || "Low"}
                  </span>
                </div>

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

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-full max-w-lg space-y-3">
            <h3 className="font-bold">{selected.location}</h3>

            <select
              className="w-full border rounded"
              value={severityDraft}
              onChange={(e) => setSeverityDraft(e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={handleSaveSeverity}
                disabled={saving}
                className="bg-indigo-600 text-white px-4 py-2 rounded"
              >
                {saving ? "Saving…" : "Save severity"}
              </button>

              <button
                onClick={handleResolve}
                disabled={resolving || selected.status === "resolved"}
                className="bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-60"
              >
                {resolving ? "Resolving…" : "Resolve"}
              </button>

              <button
                onClick={() => setSelected(null)}
                className="border px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
