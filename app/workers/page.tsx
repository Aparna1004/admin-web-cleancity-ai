import { AppShell } from "../../components/AppShell";
import { WorkersClient, type WorkerRow } from "./WorkersClient";
import { getSupabaseServiceClient } from "../../lib/supabaseServer";

export default async function WorkersPage() {
  const supabase = getSupabaseServiceClient();

  const { data: workerRows, error } = await supabase
    .from("workers")
    .select("id, name, active, zone")
    .order("id", { ascending: true });

  if (error) {
    console.error("[WorkersPage] Failed to fetch workers", error);
  }

  const rows = Array.isArray(workerRows) ? workerRows : [];

  const workers: WorkerRow[] = rows.map((w: any) => ({
    id: w.id,
    active: !!w.active,
    zone: w.zone ?? "Unknown",
    profiles: { full_name: w.name ?? "Worker" },
  }));

  return (
    <AppShell>
      <WorkersClient workers={workers} />
    </AppShell>
  );
}
