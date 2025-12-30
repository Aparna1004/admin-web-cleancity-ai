import { AppShell } from "../../components/AppShell";
import { OverviewCard } from "../../components/OverviewCard";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";

type ReportRow = {
  id: string;
  status: string | null;
  severity: string | null;
  created_at: string | null;
};

export default async function DashboardPage() {
  const supabase = getSupabaseServiceClient();

  // ---------- METRICS ----------
  const [
    { count: totalReports },
    { count: cleaned },
    { count: pending },
    { count: workerCount },
  ] = await Promise.all([
    supabase.from("reports").select("*", { head: true, count: "exact" }),
    supabase
      .from("reports")
      .select("id", { head: true, count: "exact" })
      .in("status", ["resolved", "closed"]),
    supabase
      .from("reports")
      .select("id", { head: true, count: "exact" })
      .or("status.is.null,status.eq.open,status.eq.pending"),
    supabase.from("workers").select("id", { head: true, count: "exact" }),
  ]);

  // ---------- RECENT REPORTS (LAST 30 DAYS) ----------
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: recentReports, error } = await supabase
    .from("reports")
    .select("id, created_at, severity, status")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[DashboardPage] recentReports error", error);
  }

  const reports: ReportRow[] = Array.isArray(recentReports)
    ? (recentReports as ReportRow[])
    : [];

  // ---------- LINE CHART (LAST 7 DAYS) ----------
  const dayCounts: { label: string; count: number }[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);

    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = reports.filter((r) => {
      if (!r.created_at) return false;
      return new Date(r.created_at).toDateString() === d.toDateString();
    }).length;

    dayCounts.push({ label, count });
  }

  const maxLine = Math.max(...dayCounts.map((d) => d.count), 1);
  const linePoints = dayCounts
    .map(
      (d, i) =>
        `${(i / Math.max(dayCounts.length - 1, 1)) * 100},${
          100 - (d.count / maxLine) * 100
        }`
    )
    .join(" ");

  // ---------- SEVERITY MIX ----------
  const severityCounts: Record<string, number> = {};
  reports.forEach((r) => {
    const key = r.severity ?? "unknown";
    severityCounts[key] = (severityCounts[key] || 0) + 1;
  });

  const bars = Object.entries(severityCounts).map(([zone, score]) => ({
    zone,
    score,
  }));

  const maxBar = Math.max(...bars.map((b) => b.score), 1);

  console.log("[DashboardPage] severity bars", bars);

  // ---------- METRIC CARDS ----------
  const metrics = [
    { label: "Total Reports", value: totalReports ?? 0 },
    { label: "Cleaned Locations", value: cleaned ?? 0 },
    { label: "Pending Locations", value: pending ?? 0 },
    { label: "Worker Count", value: workerCount ?? 0 },
  ];

  return (
    <AppShell>
      {/* ===== METRICS ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <OverviewCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      {/* ===== CHARTS ===== */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- REPORTS OVER TIME ---- */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Reports Over Time
            </h2>
            <span className="text-xs text-slate-500">Last 7 days</span>
          </div>

          <div className="h-64">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <polyline
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
                points={linePoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* ---- SEVERITY MIX ---- */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">
              Severity Mix
            </h2>
            <span className="text-xs text-slate-500">
              Higher = more reports
            </span>
          </div>

          <div className="h-64 flex items-end gap-4">
            {bars.map((b) => {
              const color =
                b.zone === "high"
                  ? "bg-red-600"
                  : b.zone === "medium"
                  ? "bg-yellow-500"
                  : "bg-indigo-600";

              return (
                <div
                  key={b.zone}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full h-40 rounded-lg bg-slate-100 flex items-end">
                    <div
                      className={`w-full rounded-lg ${color} transition-all`}
                      style={{
                        height: `${(b.score / maxBar) * 100}%`,
                        minHeight: "12%",
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 text-center">
                    {b.zone}
                  </p>
                  <p className="text-xs font-semibold text-slate-800">
                    {b.score}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
