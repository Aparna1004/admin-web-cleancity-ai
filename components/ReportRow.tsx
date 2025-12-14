"use client";

import Image from "next/image";
import { Report } from "../lib/mockReports";

export function ReportRow({ report, onSelect }: { report: Report; onSelect: () => void }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="p-3">
        <div className="relative h-12 w-16 overflow-hidden rounded-md border border-slate-200">
          <Image src={report.image} alt={report.location} fill className="object-cover" />
        </div>
      </td>
      <td className="p-3 text-sm font-semibold text-slate-900">{report.location}</td>
      <td className="p-3 text-sm">
        <SeverityBadge level={report.severity} />
      </td>
      <td className="p-3 text-sm text-slate-700">{report.date}</td>
      <td className="p-3 text-sm text-slate-700">{report.status}</td>
      <td className="p-3 text-right">
        <button
          onClick={onSelect}
          className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
        >
          View
        </button>
      </td>
    </tr>
  );
}

function SeverityBadge({ level }: { level: Report["severity"] }) {
  const map = {
    High: "bg-rose-100 text-rose-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${map[level]}`}>
      {level}
    </span>
  );
}




