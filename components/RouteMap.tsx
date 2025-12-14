"use client";

import { MapContainer, Marker, Polyline, TileLayer, Popup } from "react-leaflet";
import { Route } from "../lib/mockRoutes";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function RouteMap({ route }: { route: Route }) {
  const bounds = useMemo(
    () => route.stops.map((s) => [s.lat, s.lng]) as [number, number][],
    [route.stops]
  );

  return (
    <div className="h-[360px] w-full overflow-hidden rounded-xl border border-slate-200">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={bounds} color="#4F46E5" />
        {route.stops.map((stop) => (
          <Marker key={stop.id} position={[stop.lat, stop.lng]} icon={markerIcon}>
            <Popup>
              <div className="text-sm font-semibold">{stop.name}</div>
              <div className="text-xs text-slate-600">Severity: {stop.severity}</div>
              <div className="text-xs text-slate-600">Status: {stop.status}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}




