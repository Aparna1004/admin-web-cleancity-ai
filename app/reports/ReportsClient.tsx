"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { AppShell } from "../../components/AppShell";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const processedIds = useRef<Set<string>>(new Set());

  const closeToast = () => {
    setToastMessage(null);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2500);
  };

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
  const performDelete = async (id: string) => {
    if (processedIds.current.has(id) || deletingId === id) return;

    processedIds.current.add(id);
    setDeletingId(id);
    setError(null);
    setDeleteConfirmOpen(false);
    setDeleteConfirmId(null);

    setRows((prev) => prev.filter((r) => r.id !== id));
    setSelected(null);

    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "DELETE",
      });

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

  const handleDelete = (id: string) => {
    if (processedIds.current.has(id) || deletingId === id) return;
    setDeleteConfirmId(id);
    setDeleteConfirmOpen(true);
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ severity: severityDraft }),
      });

      if (!res.ok) throw new Error("Update failed");

      // Close the change menu immediately so the admin can continue working.
      setSelected(null);
      showToast(`Severity changed to ${uiSeverity}`);
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

    try {
      const res = await fetch(`/api/reports/${selected.id}/resolve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Resolve failed");
      }

      setRows((prev) =>
        prev.map((r) =>
          r.id === selected.id ? { ...r, status: "resolved" } : r
        )
      );

      setSelected(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Failed to resolve report");
    } finally {
      setResolving(false);
    }
  };

  const visibleRows = rows.filter((r) =>
    showAttentionOnly ? !!r.attention : true
  );

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

        {visibleRows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
            No reports found{showAttentionOnly ? " for attention." : "."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleRows.map((r) => (
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

                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100">
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
                    className="bg-red-100 text-red-700 rounded px-2 py-1 text-xs"
                  >
                    {deletingId === r.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}
      </div>

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
                onClick={() => setSelected(null)}
                className="border px-4 py-2 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmOpen && deleteConfirmId ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setDeleteConfirmOpen(false);
            setDeleteConfirmId(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-5 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm text-slate-600">Delete this report?</div>
            <div className="mt-1 text-xs text-slate-500">
              This action cannot be undone.
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="border rounded px-3 py-1.5 text-sm"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteConfirmId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white rounded px-3 py-1.5 text-sm"
                disabled={deletingId === deleteConfirmId}
                onClick={() => performDelete(deleteConfirmId)}
              >
                {deletingId === deleteConfirmId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toastMessage ? (
        <div className="fixed bottom-5 right-5 z-[60]">
          <div
            className="bg-slate-900 text-white rounded-xl shadow-lg px-4 py-3 flex items-start gap-3"
            role="status"
          >
            <div className="text-sm leading-5">{toastMessage}</div>
            <button
              type="button"
              className="ml-2 text-slate-300 hover:text-white"
              onClick={closeToast}
              aria-label="Close notification"
            >
              x
            </button>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
