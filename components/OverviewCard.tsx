"use client";

export function OverviewCard({
  label,
  value,
  delta,
}: {
  label: string;
  value: string | number;
  delta?: number;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs uppercase text-slate-500 font-semibold">{label}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {delta !== undefined && (
        <p className={`text-sm font-semibold ${positive ? "text-emerald-600" : "text-rose-600"}`}>
          {positive ? "▲" : "▼"} {Math.abs(delta)}%
        </p>
      )}
    </div>
  );
}




