import { ReportsClient, type ReportItem } from "./ReportsClient";
import { reports as mockReports } from "../../lib/mockReports";

export default async function ReportsPage() {
  const reports: ReportItem[] = mockReports.map((r) => ({
    id: r.id,
    image_url: r.image,
    description: r.description ?? "",
    severity: r.severity ?? "Low",
    status: (r.status as string) || "open",
    created_at: r.date || "",
    location: r.location ?? "Unknown location",
  }));

  return <ReportsClient reports={reports} />;
}