export type ReportStatus = "New" | "In Review" | "Dispatched" | "Closed";

export type Report = {
  id: string;
  image: string;
  location: string;
  severity: "Low" | "Medium" | "High";
  date: string;
  status: ReportStatus;
  description?: string;
};

export const reports: Report[] = [
  {
    id: "REP-101",
    image: "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=400&q=60",
    location: "Sector 21 Transit Hub",
    severity: "High",
    date: "2025-12-08",
    status: "Dispatched",
    description: "Overflowing bins near bus bay blocking commuters.",
  },
  {
    id: "REP-102",
    image: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=400&q=60",
    location: "Old Market Rear Lane",
    severity: "Medium",
    date: "2025-12-08",
    status: "In Review",
    description: "Glass shards reported behind vendor stalls.",
  },
  {
    id: "REP-103",
    image: "https://images.unsplash.com/photo-1444664597500-035db93e2323?auto=format&fit=crop&w=400&q=60",
    location: "Skybridge Plaza",
    severity: "Low",
    date: "2025-12-07",
    status: "Closed",
    description: "Minor litter on pedestrian bridge.",
  },
];

export async function fetchReports(): Promise<Report[]> {
  return Promise.resolve(reports);
}




