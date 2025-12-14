export type WorkerStatus = "Online" | "Offline";

export type Worker = {
  id: string;
  name: string;
  zone: string;
  totalCleanups: number;
  status: WorkerStatus;
};

export const workers: Worker[] = [
  { id: "W-1", name: "Aditi Sharma", zone: "Ward 4", totalCleanups: 42, status: "Online" },
  { id: "W-2", name: "Rahul Verma", zone: "Ward 7", totalCleanups: 37, status: "Online" },
  { id: "W-3", name: "Sana Qureshi", zone: "Corridor 3", totalCleanups: 28, status: "Offline" },
  { id: "W-4", name: "Vikram Rao", zone: "Ward 4", totalCleanups: 51, status: "Online" },
  { id: "W-5", name: "Meera Nair", zone: "Old Town", totalCleanups: 45, status: "Online" },
];

export async function fetchWorkers(): Promise<Worker[]> {
  return Promise.resolve(workers);
}




