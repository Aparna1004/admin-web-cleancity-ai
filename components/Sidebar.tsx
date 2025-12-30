"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FiActivity, FiLogOut, FiMap, FiUsers, FiClipboard, FiPackage } from "react-icons/fi";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: FiActivity },
  { href: "/routes", label: "Routes", icon: FiMap },
  { href: "/workers", label: "Workers", icon: FiUsers },
  { href: "/reports", label: "Reports", icon: FiClipboard },
  { href: "/bin-requests", label: "Bin Requests", icon: FiPackage },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    localStorage.removeItem("admin");
    router.replace("/login");
  }

  return (
    <aside className="w-64 min-h-screen border-r border-slate-200 bg-white px-4 py-6 flex flex-col gap-6">
      <div className="px-2">
        <p className="text-xs uppercase text-slate-500 font-semibold">CleanCity Admin</p>
        <p className="text-lg font-bold text-slate-900">Operations</p>
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                active
                  ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-slate-100"
      >
        <FiLogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}




