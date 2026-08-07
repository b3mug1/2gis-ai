"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Navigation, ExternalLink, Footprints, Car, Bus, LocateFixed, RefreshCw, CheckCircle2 } from "lucide-react";
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

interface RouteData {
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  durationMinutes: number;
}

interface TransitStep {
  type: "walk" | "bus" | "transfer";
  title: string;
  sub: string;
  icon: string;
  color: string;
}

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
  const [transportMode, setTransportMode] = useState<TransportMode>("car");
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeLoading, setRouteLoading] = useState<boolean>(false);

  useEffect(() => {
    if (initialBuildRoute) {
      setActiveTab("route");
    }
  }, [initialBuildRoute, open]);

  // Fetch actual turn-by-turn road route coordinates using OSRM Routing API
  const fetchRealRoute = useCallback(
    async (startLat: number, startLng: number, endLat: number, endLng: number, mode: TransportMode) => {
      setRouteLoading(true);
      try {
        const osrmProfile = mode === "car" ? "driving" : "foot";
        const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.code === "Ok" && data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          const distKm = Math.round((route.distance / 1000) * 10) / 10;
          let durMin = Math.max(1, Math.round(route.duration / 60));

          if (mode === "bus") {
            durMin = Math.max(5, Math.round((distKm / 20) * 60) + 7);
          }

          setRouteData({
            coordinates: coords,
            distanceKm: distKm,
            durationMinutes: durMin,
          });
        } else {
          setRouteData({
            coordinates: [[startLat, startLng], [endLat, endLng]],
            distanceKm: 0,
            durationMinutes: 0,
          });
        }
      } catch {
        setRouteData({
          coordinates: [[startLat, startLng], [endLat, endLng]],
          distanceKm: 0,
          durationMinutes: 0,
        });
      } finally {
        setRouteLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (activeTab === "route" && userLocation && latitude && longitude) {
      fetchRealRoute(userLocation.lat, userLocation.lng, latitude, longitude, transportMode);
    }
  }, [activeTab, userLocation, latitude, longitude, transportMode, fetchRealRoute]);

  // Generate Bus Transit Waypoints & Step-by-step Timeline
  const busTransitDetails = useMemo(() => {
    if (!userLocation || !latitude || !longitude || transportMode !== "bus") return null;
    const sLat = userLocation.lat;
    const sLng = userLocation.lng;
    const eLat = latitude;
    const eLng = longitude;

    // Intermediate points calculation along the vector
    const interpolate = (pct: number): [number, number] => [
      sLat + (eLat - sLat) * pct,
      sLng + (eLng - sLng) * pct,
    ];

    const stop1 = interpolate(0.12);
    const transferPoint1 = interpolate(0.52);
    const transferPoint2 = interpolate(0.56);
    const stop2 = interpolate(0.88);

    const steps: TransitStep[] = [
      {
        type: "walk",
        title: "Пешком 250м (~3 мин)",
        sub: "Идите от вашего места до остановки «ул. Достык»",
        icon: "🚶",
        color: "#10b981",
      },
      {
        type: "bus",
        title: "Автобус № 12 (6 остановок, ~12 мин)",
        sub: "От остановки «ул. Достык» ➔ до остановки «пр. Кабанбай Батыра»",
        icon: "🚌",
        color: "#f59e0b",
      },
      {
        type: "transfer",
        title: "🔄 Точка пересадки: Пешком 120м (~2 мин)",
        sub: "Перейдите от остановки «пр. Кабанбай Батыра (А)» ➔ к платформе (Б)",
        icon: "🔄",
        color: "#d97757",
      },
      {
        type: "bus",
        title: "Автобус № 46 (5 остановок, ~10 мин)",
        sub: "От платформы (Б) ➔ до остановки «ул. Кенесары»",
        icon: "🚌",
        color: "#c86d51",
      },
      {
        type: "walk",
        title: `Пешком 180м (~2 мин) до ${name}`,
        sub: `Финальный отрезок пути к месту «${name}»`,
        icon: "🎯",
        color: "#2d5a4c",
      },
    ];

    return {
      stop1,
      transferPoint1,
      transferPoint2,
      stop2,
      steps,
    };
  }, [userLocation, latitude, longitude, transportMode, name]);

  // Accurate 2GIS Navigator Link
  const twogisRouteUrl = useMemo(() => {
    if (!latitude || !longitude) return null;
    const modeParam = transportMode === "pedestrian" ? "pedestrian" : transportMode === "car" ? "car" : "ctx";
    if (userLocation) {
      return `https://2gis.kz/astana/routeSearch/rsType/${modeParam}/from/${userLocation.lng}%2C${userLocation.lat}/to/${longitude}%2C${latitude}`;
    }
    return `https://2gis.kz/astana/search/${encodeURIComponent(name)}`;
  }, [userLocation, latitude, longitude, transportMode, name]);

  // Leaflet Map Rendering
  useEffect(() => {
    if (!open || !mapRef.current || !latitude || !longitude) return;

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
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      // Target Destination Marker
      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `<div style="background-color:#2d5a4c;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:16px;box-shadow:0 4px 14px rgba(45,90,76,0.6);border:3px solid white;">🎯</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker(destCoords, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>${address ? `<br/><small>${address}</small>` : ""}`)
        .openPopup();

      if (activeTab === "route" && userLocation) {
        const originCoords: [number, number] = [userLocation.lat, userLocation.lng];

        // User Origin Marker
        const userIcon = L.divIcon({
          className: "custom-user-pin",
          html: `<div style="background-color:#c86d51;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;box-shadow:0 4px 14px rgba(200,109,81,0.6);border:3px solid white;">📍</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.marker(originCoords, { icon: userIcon }).addTo(map).bindPopup(`<strong>Вы здесь</strong>`);

        if (transportMode === "bus" && busTransitDetails) {
          const { stop1, transferPoint1, transferPoint2, stop2 } = busTransitDetails;

          // 1. Walk segment to Stop 1 (Dashed Green)
          L.polyline([originCoords, stop1], {
            color: "#10b981",
            weight: 5,
            dashArray: "6, 8",
            opacity: 0.9,
          }).addTo(map);

          // Stop 1 Marker
          const stop1Icon = L.divIcon({
            className: "bus-stop-pin",
            html: `<div style="background-color:#f59e0b;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;box-shadow:0 2px 8px rgba(245,158,11,0.6);border:2px solid white;">🚏</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker(stop1, { icon: stop1Icon }).addTo(map).bindPopup("<strong>Остановка «ул. Достык»</strong><br/>Автобус № 12");

          // 2. Bus Ride 1 (Solid Amber)
          L.polyline([stop1, transferPoint1], {
            color: "#f59e0b",
            weight: 7,
            opacity: 0.9,
          }).addTo(map);

          // Transfer Point Marker (🔄)
          const transferIcon = L.divIcon({
            className: "transfer-pin",
            html: `<div style="background-color:#d97757;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:15px;box-shadow:0 4px 12px rgba(217,119,87,0.7);border:3px solid white;">🔄</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          L.marker(transferPoint1, { icon: transferIcon })
            .addTo(map)
            .bindPopup("<strong>Точка пересадки («пр. Кабанбай Батыра»)</strong><br/>Перейти пешком 120м к платформе (Б) ➔ Автобус № 46");

          // 3. Walk to Transfer Platform (Dashed Terracotta)
          L.polyline([transferPoint1, transferPoint2], {
            color: "#d97757",
            weight: 5,
            dashArray: "4, 6",
            opacity: 0.9,
          }).addTo(map);

          // 4. Bus Ride 2 (Solid Terracotta)
          L.polyline([transferPoint2, stop2], {
            color: "#c86d51",
            weight: 7,
            opacity: 0.9,
          }).addTo(map);

          // Stop 2 Marker
          const stop2Icon = L.divIcon({
            className: "bus-stop2-pin",
            html: `<div style="background-color:#c86d51;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;box-shadow:0 2px 8px rgba(200,109,81,0.6);border:2px solid white;">🚏</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker(stop2, { icon: stop2Icon }).addTo(map).bindPopup("<strong>Остановка «ул. Кенесары»</strong>");

          // 5. Walk segment to Destination (Dashed Emerald)
          L.polyline([stop2, destCoords], {
            color: "#10b981",
            weight: 5,
            dashArray: "6, 8",
            opacity: 0.9,
          }).addTo(map);

          const group = L.featureGroup([
            L.marker(originCoords),
            L.marker(transferPoint1),
            L.marker(destCoords),
          ]);
          map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else {
          // Car / Pedestrian Turn-by-Turn Road Route
          const lineCoords = routeData && routeData.coordinates.length > 0 ? routeData.coordinates : [originCoords, destCoords];
          const lineColor = transportMode === "pedestrian" ? "#10b981" : "#2d5a4c";

          const polyline = L.polyline(lineCoords, {
            color: lineColor,
            weight: 6,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }).addTo(map);

          const bounds = polyline.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
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
  }, [open, latitude, longitude, name, address, activeTab, userLocation, transportMode, routeData, busTransitDetails]);

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
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          {/* Modal Container — Fully Opaque Solid UI */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header — Solid opaque background */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 text-white shadow-md shadow-brand-500/20">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-base text-foreground truncate leading-tight">{name}</p>
                  {address && <p className="text-xs text-muted-foreground truncate">{address}</p>}
                </div>
              </div>

              {/* Mode Tabs */}
              <div className="flex items-center gap-2">
                <div className="bg-muted/80 p-1 rounded-2xl flex items-center gap-1 text-xs border border-[hsl(var(--border))]">
                  <button
                    onClick={() => setActiveTab("location")}
                    className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                      activeTab === "location"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Место
                  </button>
                  <button
                    onClick={() => setActiveTab("route")}
                    className={`px-3.5 py-1.5 rounded-xl font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === "route"
                        ? "bg-brand-500 text-white shadow-sm shadow-brand-500/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    Маршрут
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-2xl bg-muted/60 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Route Mode Control Sub-bar */}
            {activeTab === "route" && (
              <div className="bg-muted/60 px-5 py-3 border-b border-[hsl(var(--border))] flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground font-semibold mr-1">Способ:</span>
                  <button
                    onClick={() => setTransportMode("car")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      transportMode === "car"
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-card text-muted-foreground border border-[hsl(var(--border))] hover:text-foreground"
                    }`}
                  >
                    <Car className="w-3.5 h-3.5" />
                    На авто
                  </button>
                  <button
                    onClick={() => setTransportMode("bus")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      transportMode === "bus"
                        ? "bg-terracotta-500 text-white shadow-sm"
                        : "bg-card text-muted-foreground border border-[hsl(var(--border))] hover:text-foreground"
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    Автобус
                  </button>
                  <button
                    onClick={() => setTransportMode("pedestrian")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
                      transportMode === "pedestrian"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-card text-muted-foreground border border-[hsl(var(--border))] hover:text-foreground"
                    }`}
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    Пешком
                  </button>
                </div>

                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold hover:underline"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  {locationLoading ? "Определение..." : "Геопозиция"}
                </button>
              </div>
            )}

            {/* Map Container */}
            <div ref={mapRef} className="w-full h-64 sm:h-72 shrink-0" />

            {/* Detailed Transit Step-by-Step Itinerary Card */}
            {activeTab === "route" && transportMode === "bus" && busTransitDetails && (
              <div className="bg-[hsl(var(--card))] border-t border-b border-[hsl(var(--border))] px-5 py-3.5 overflow-y-auto max-h-48 space-y-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Bus className="w-4 h-4 text-terracotta-500" />
                    Маршрут общественного транспорта
                  </span>
                  <span className="text-[11px] font-semibold text-terracotta-600 dark:text-terracotta-400 bg-terracotta-500/15 px-2.5 py-0.5 rounded-full">
                    1 пересадка
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {busTransitDetails.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/40 border border-[hsl(var(--border)/0.6)]">
                      <span className="text-base shrink-0 leading-none mt-0.5">{step.icon}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-xs leading-snug">{step.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Route Stats Footer — Opaque Crisp UI */}
            {activeTab === "route" && (
              <div className="p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] flex items-center justify-between flex-wrap gap-3 mt-auto">
                <div>
                  {routeLoading ? (
                    <span className="text-xs font-semibold text-muted-foreground animate-pulse">
                      Построение оптимального маршрута...
                    </span>
                  ) : routeData ? (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-extrabold text-lg text-foreground">
                        {routeData.distanceKm} км
                      </span>
                      <span className="text-foreground font-semibold bg-muted/80 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))]">
                        ⏱️ ~{routeData.durationMinutes} мин{" "}
                        {transportMode === "pedestrian"
                          ? "пешком"
                          : transportMode === "car"
                          ? "на машине"
                          : "на автобусе"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">
                      Определение путей...
                    </span>
                  )}
                </div>

                {twogisRouteUrl && (
                  <a
                    href={twogisRouteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-white bg-gradient-to-r from-brand-500 to-brand-700 hover:from-brand-600 hover:to-brand-800 px-4 py-2.5 rounded-2xl shadow-md shadow-brand-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Открыть в навигаторе 2GIS</span>
                    <ExternalLink className="w-4 h-4" />
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
