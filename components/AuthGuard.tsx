"use client";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  // Frontend-only mode: no guarding.
  return <>{children}</>;
}
