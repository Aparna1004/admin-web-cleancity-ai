import { AppShell } from "../../components/AppShell";
import { OverviewCard } from "../../components/OverviewCard";
import { reports } from "../../lib/mockReports";
import { workers } from "../../lib/mockWorkers";
import { routes } from "../../lib/mockRoutes";

type ReportRow = { id: string; status: string | null; severity: string | null; created_at: string };
type WorkerRow = { id: string };
type RouteRow = { id: string };

export default async function DashboardPage() {
  const reportsData = reports as unknown as ReportRow[];
  const workersData = workers as unknown as WorkerRow[];
  const routesData = routes as unknown as RouteRow[];

  const totalReports = reportsData.length;
  const cleaned = reportsData.filter((r) => r.status === "resolved" || r.status === "closed").length;
  const pending = reportsData.filter((r) => !r.status || r.status === "open").length;
  const workerCount = workersData.length;

  const metrics = [
    { label: "Total Reports", value: totalReports },
    { label: "Cleaned Locations", value: cleaned },
    { label: "Pending Locations", value: pending },
    { label: "Worker Count", value: workerCount },
  ];

  const dayCounts: { label: string; count: number }[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = reportsData.filter((r) => {
      const created = new Date(r.created_at);
      return created.toDateString() === d.toDateString();
    }).length;
    dayCounts.push({ label, count });
  }

  const maxLine = Math.max(...dayCounts.map((d) => d.count), 1);
  const points = dayCounts
    .map((d, i) => `${(i / Math.max(dayCounts.length - 1, 1)) * 100},${100 - (d.count / maxLine) * 100}`)
    .join(" ");

  const severityCounts: Record<string, number> = {};
  reportsData.forEach((r) => {
    const key = r.severity ?? "unknown";
    severityCounts[key] = (severityCounts[key] || 0) + 1;
  });
  const bars = Object.entries(severityCounts).map(([zone, score]) => ({ zone, score }));
  const maxBar = Math.max(...bars.map((b) => b.score), 1);

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <OverviewCard key={m.label} label={m.label} value={m.value} />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Reports Over Time</h2>
            <span className="text-xs text-slate-500">Recent activity</span>
          </div>
          <div className="h-64">
            <svg viewBox="0 0 100 100" className="h-full w-full">
              <polyline
                fill="none"
                stroke="#4F46E5"
                strokeWidth="2"
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900">Severity Mix</h2>
            <span className="text-xs text-slate-500">Higher = more reports</span>
          </div>
          <div className="h-64 flex items-end gap-3">
            {bars.map((b) => (
              <div key={b.zone} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full rounded-lg bg-indigo-100">
                  <div
                    className="w-full rounded-lg bg-indigo-600 transition-all"
                    style={{ height: `${(b.score / maxBar) * 100}%`, minHeight: "12%" }}
                  />
                </div>
                <p className="text-xs text-center text-slate-600">{b.zone}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}


