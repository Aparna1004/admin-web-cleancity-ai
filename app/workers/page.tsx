import { AppShell } from "../../components/AppShell";
import { WorkersClient, type WorkerRow } from "./WorkersClient";
import { workers as mockWorkers } from "../../lib/mockWorkers";

export default async function WorkersPage() {
  const workers: WorkerRow[] = mockWorkers.map((w) => ({
    id: w.id,
    active: w.status === "Online",
    zone: w.zone,
    profiles: { full_name: w.name },
  }));

  return (
    <AppShell>
      <WorkersClient workers={workers} />
    </AppShell>
  );
}
