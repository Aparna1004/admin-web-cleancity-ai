export type DashboardMetric = {
  label: string;
  value: number | string;
  delta?: number;
};

export const overviewMetrics: DashboardMetric[] = [
  { label: "Total Reports", value: 312, delta: 8 },
  { label: "Cleaned Locations", value: 189, delta: 12 },
  { label: "Pending Locations", value: 47, delta: -5 },
  { label: "Worker Count", value: 26 },
];

export const reportsOverTime = [
  { day: "Mon", count: 22 },
  { day: "Tue", count: 28 },
  { day: "Wed", count: 31 },
  { day: "Thu", count: 27 },
  { day: "Fri", count: 34 },
  { day: "Sat", count: 26 },
  { day: "Sun", count: 19 },
];

export const zoneSeverity = [
  { zone: "Ward 4", score: 72 },
  { zone: "Old Town", score: 88 },
  { zone: "Corridor 3", score: 64 },
  { zone: "Airport Hwy", score: 53 },
  { zone: "Sector 12", score: 69 },
];

export async function fetchOverview() {
  return Promise.resolve(overviewMetrics);
}

export async function fetchReportsOverTime() {
  return Promise.resolve(reportsOverTime);
}

export async function fetchZoneSeverity() {
  return Promise.resolve(zoneSeverity);
}




