"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Navigation, ExternalLink, Footprints, Car, Bus, LocateFixed } from "lucide-react";
import { useUserLocation } from "@/hooks/useUserLocation";

interface MapModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  initialBuildRoute?: boolean;
}

type TransportMode = "pedestrian" | "car" | "bus";

export function MapModal({
  open,
  onClose,
  name,
  address,
  latitude,
  longitude,
  initialBuildRoute = false,
}: MapModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const { location: userLocation, requestLocation, loading: locationLoading } = useUserLocation();

  const [activeTab, setActiveTab] = useState<"location" | "route">(
    initialBuildRoute ? "route" : "location"
  );
  const [transportMode, setTransportMode] = useState<TransportMode>("pedestrian");

  useEffect(() => {
    if (initialBuildRoute) {
      setActiveTab("route");
    }
  }, [initialBuildRoute, open]);

  // Calculate straight-line distance in km using Haversine formula
  const distanceKm = useMemo(() => {
    if (!userLocation || !latitude || !longitude) return null;
    const R = 6371; // Earth's radius in km
    const dLat = ((latitude - userLocation.lat) * Math.PI) / 180;
    const dLon = ((longitude - userLocation.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((userLocation.lat * Math.PI) / 180) *
        Math.cos((latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, [userLocation, latitude, longitude]);

  // Calculate estimated travel time in minutes based on transport mode
  const travelTimeMinutes = useMemo(() => {
    if (distanceKm == null) return null;
    const speeds: Record<TransportMode, number> = {
      pedestrian: 4.5, // 4.5 km/h walking speed
      car: 30, // 30 km/h avg city driving speed
      bus: 18, // 18 km/h avg bus speed with stops
    };
    const speed = speeds[transportMode];
    const hours = distanceKm / speed;
    return Math.max(1, Math.round(hours * 60));
  }, [distanceKm, transportMode]);

  // 2GIS navigation route URL
  const twogisRouteUrl = useMemo(() => {
    if (!latitude || !longitude) return null;
    const modeParam = transportMode === "pedestrian" ? "pedestrian" : transportMode === "car" ? "car" : "ctx";
    if (userLocation) {
      return `https://2gis.ru/routeSearch/rsType/${modeParam}/from/${userLocation.lng},${userLocation.lat}/to/${longitude},${latitude}`;
    }
    return `https://2gis.ru/astana/search/${encodeURIComponent(name)}`;
  }, [userLocation, latitude, longitude, transportMode, name]);

  useEffect(() => {
    if (!open || !mapRef.current || !latitude || !longitude) return;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      const destCoords: [number, number] = [latitude, longitude];
      const originCoords: [number, number] | null = userLocation ? [userLocation.lat, userLocation.lng] : null;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Destination Marker
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `<div style="background-color:#6366f1;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;box-shadow:0 4px 12px rgba(99,102,241,0.5);border:2px solid white;">🎯</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker(destCoords, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>${address ? `<br/><small>${address}</small>` : ""}`)
        .openPopup();

      if (activeTab === "route" && originCoords) {
        // Origin Marker (User location)
        const userIcon = L.divIcon({
          className: "custom-user-pin",
          html: `<div style="background-color:#10b981;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 4px 12px rgba(16,185,129,0.5);border:2px solid white;">📍</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker(originCoords, { icon: userIcon })
          .addTo(map)
          .bindPopup(`<strong>Вы здесь</strong>`);

        // Route Polyline
        const polyline = L.polyline([originCoords, destCoords], {
          color: transportMode === "pedestrian" ? "#10b981" : transportMode === "car" ? "#6366f1" : "#f59e0b",
          weight: 5,
          opacity: 0.8,
          dashArray: transportMode === "pedestrian" ? "8, 8" : undefined,
        }).addTo(map);

        // Fit map view bounds to cover both origin and destination
        const bounds = L.latLngBounds([originCoords, destCoords]);
        map.fitBounds(bounds, { padding: [50, 50] });
      } else {
        map.setView(destCoords, 16);
      }

      mapInstanceRef.current = map;
    });

    return () => {
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }
    };
  }, [open, latitude, longitude, name, address, activeTab, userLocation, transportMode]);

  if (!latitude || !longitude) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-[hsl(var(--border))] bg-card shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[hsl(var(--border))]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{name}</p>
                  {address && <p className="text-xs text-muted-foreground truncate">{address}</p>}
                </div>
              </div>

              {/* Mode Tabs (Location vs Route) */}
              <div className="flex items-center gap-1.5">
                <div className="bg-muted p-1 rounded-xl flex items-center gap-1 text-xs">
                  <button
                    onClick={() => setActiveTab("location")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all ${
                      activeTab === "location"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Место
                  </button>
                  <button
                    onClick={() => setActiveTab("route")}
                    className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                      activeTab === "route"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    Маршрут
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sub-bar for Route Transport Selectors */}
            {activeTab === "route" && (
              <div className="bg-muted/40 px-5 py-2.5 border-b border-[hsl(var(--border))] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-medium">Способ:</span>
                  <button
                    onClick={() => setTransportMode("pedestrian")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                      transportMode === "pedestrian"
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    Пешком
                  </button>
                  <button
                    onClick={() => setTransportMode("car")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                      transportMode === "car"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    На авто
                  </button>
                  <button
                    onClick={() => setTransportMode("bus")}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                      transportMode === "bus"
                        ? "bg-amber-500 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    Автобус
                  </button>
                </div>

                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center gap-1 text-[11px] text-brand-500 hover:text-brand-600 font-medium"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  {locationLoading ? "Определение..." : "Обновить геопозицию"}
                </button>
              </div>
            )}

            {/* Map Container */}
            <div ref={mapRef} className="w-full h-80 sm:h-96 shrink-0" />

            {/* Route Stats Footer */}
            {activeTab === "route" && (
              <div className="p-4 bg-card border-t border-[hsl(var(--border))] flex items-center justify-between flex-wrap gap-3">
                <div>
                  {distanceKm != null ? (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-base text-foreground">
                        {distanceKm} км
                      </span>
                      <span className="text-muted-foreground bg-muted px-2.5 py-1 rounded-md font-medium">
                        ⏱️ ~{travelTimeMinutes} мин{" "}
                        {transportMode === "pedestrian"
                          ? "пешком"
                          : transportMode === "car"
                          ? "на машине"
                          : "на автобусе"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Определяем геопозицию...
                    </span>
                  )}
                </div>

                {twogisRouteUrl && (
                  <a
                    href={twogisRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 px-4 py-2 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Открыть в навигаторе 2GIS
                  </a>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
