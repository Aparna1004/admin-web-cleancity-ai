export type StopStatus = "Pending" | "Done";

export type RouteStop = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  severity: "Low" | "Medium" | "High";
  status: StopStatus;
  beforeImage?: string;
  afterImage?: string;
};

export type Route = {
  id: string;
  zone: string;
  stops: RouteStop[];
  worker: string;
  status: "On track" | "Delayed" | "At risk";
};

export const routes: Route[] = [
  {
    id: "R-401",
    zone: "Ward 4",
    worker: "Vikram Rao",
    status: "On track",
    stops: [
      { id: "S-1", name: "Sector 21 Transit Hub", lat: 28.6129, lng: 77.2295, severity: "Medium", status: "Pending" },
      { id: "S-2", name: "Parkside Pavilion", lat: 28.6141, lng: 77.231, severity: "High", status: "Pending" },
      { id: "S-3", name: "Metro Gate 3", lat: 28.6182, lng: 77.2339, severity: "Low", status: "Done", afterImage: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=60" },
      { id: "S-4", name: "Tech Park Block A", lat: 28.6203, lng: 77.2351, severity: "Medium", status: "Done" },
    ],
  },
  {
    id: "R-402",
    zone: "Old Town",
    worker: "Meera Nair",
    status: "At risk",
    stops: [
      { id: "S-1", name: "Old Market Rear Lane", lat: 28.6228, lng: 77.2384, severity: "High", status: "Pending" },
      { id: "S-2", name: "Clocktower Square", lat: 28.6241, lng: 77.2391, severity: "Medium", status: "Pending" },
      { id: "S-3", name: "Canal Walk", lat: 28.6252, lng: 77.241, severity: "Low", status: "Pending" },
    ],
  },
  {
    id: "R-403",
    zone: "Corridor 3",
    worker: "Sara Thomas",
    status: "Delayed",
    stops: [
      { id: "S-1", name: "Metro Line Buffer", lat: 28.6301, lng: 77.2425, severity: "Medium", status: "Pending" },
      { id: "S-2", name: "Skybridge Plaza", lat: 28.6312, lng: 77.244, severity: "High", status: "Pending" },
    ],
  },
];

export function getRouteById(id: string): Route | undefined {
  return routes.find((route) => route.id === id);
}

export async function fetchRoutes(): Promise<Route[]> {
  return Promise.resolve(routes);
}

export async function fetchRoute(id: string): Promise<Route | undefined> {
  return Promise.resolve(getRouteById(id));
}




