"use client";

import { usePathname } from "next/navigation";
import { FiBell, FiUser } from "react-icons/fi";

export function Header() {
  const pathname = usePathname();
  const title = pathname.split("/")[1] || "dashboard";

  return (
    <header className="flex items-center justify-between py-4">
      <div>
        <p className="text-xs uppercase text-slate-500 font-semibold">CleanCity</p>
        <h1 className="text-2xl font-bold text-slate-900 capitalize">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative rounded-full border border-slate-200 p-2 hover:bg-slate-100">
          <FiBell className="h-5 w-5 text-slate-700" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-indigo-500" />
        </button>
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1">
          <FiUser className="h-4 w-4 text-slate-700" />
          <span className="text-sm font-semibold text-slate-800">Admin</span>
        </div>
      </div>
    </header>
  );
}




