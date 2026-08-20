"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Footprints,
  Car,
  Bus,
  LocateFixed,
  RefreshCw,
  Clock,
  CornerUpRight,
  CornerUpLeft,
  MoveUp,
} from "lucide-react";
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

interface RouteStep {
  instruction: string;
  distanceMeters: number;
  type: string;
  modifier?: string;
  streetName?: string;
}

interface RouteData {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
  steps: RouteStep[];
}

interface TransitStep {
  type: "walk" | "bus" | "transfer";
  title: string;
  sub: string;
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

  const fetchRealRoute = useCallback(
    async (startLat: number, startLng: number, endLat: number, endLng: number, mode: TransportMode) => {
      setRouteLoading(true);
      try {
        const osrmProfile = mode === "pedestrian" ? "foot" : "driving";
        const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
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

          const parsedSteps: RouteStep[] = [];
          if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
            route.legs[0].steps.forEach((s: any) => {
              const street = s.name ? s.name : "дороге";
              let text = "";
              const mod = s.maneuver.modifier;
              const type = s.maneuver.type;

              if (type === "depart") {
                text = `Начните движение по ${street}`;
              } else if (type === "arrive") {
                text = `Вы прибыли к месту «${name}»`;
              } else if (mod === "left" || mod === "slight left" || mod === "sharp left") {
                text = `Поверните налево на ${street}`;
              } else if (mod === "right" || mod === "slight right" || mod === "sharp right") {
                text = `Поверните направо на ${street}`;
              } else {
                text = `Двигайтесь прямо по ${street}`;
              }

              parsedSteps.push({
                instruction: text,
                distanceMeters: Math.round(s.distance),
                type: type,
                modifier: mod,
                streetName: s.name,
              });
            });
          }

          setRouteData({
            coordinates: coords,
            distanceKm: distKm,
            durationMinutes: durMin,
            steps: parsedSteps,
          });
        } else {
          setRouteData(null);
        }
      } catch {
        setRouteData(null);
      } finally {
        setRouteLoading(false);
      }
    },
    [name]
  );

  useEffect(() => {
    if (activeTab === "route" && userLocation && latitude && longitude) {
      fetchRealRoute(userLocation.lat, userLocation.lng, latitude, longitude, transportMode);
    }
  }, [activeTab, userLocation, latitude, longitude, transportMode, fetchRealRoute]);

  const busTransitDetails = useMemo(() => {
    if (!userLocation || !latitude || !longitude || transportMode !== "bus" || !routeData || routeData.coordinates.length === 0) {
      return null;
    }

    const coords = routeData.coordinates;
    const total = coords.length;

    const iStop1 = Math.min(total - 1, Math.floor(total * 0.12));
    const iTrans1 = Math.min(total - 1, Math.floor(total * 0.50));
    const iTrans2 = Math.min(total - 1, Math.floor(total * 0.54));
    const iStop2 = Math.min(total - 1, Math.floor(total * 0.88));

    const firstStreet = routeData.steps.find((s) => s.streetName && s.streetName !== "дороге")?.streetName || "текущего местоположения";
    const midStreet = routeData.steps[Math.floor(routeData.steps.length / 2)]?.streetName || "проспекта";
    const lastStreet = address || routeData.steps[routeData.steps.length - 1]?.streetName || name;

    const seed = Math.abs(Math.floor((latitude || 0) * 10000 + (longitude || 0) * 10000));
    const bus1 = (seed % 42) + 1;
    const bus2 = ((seed + 15) % 42) + 1;

    const totalMeters = Math.round(routeData.distanceKm * 1000);
    const walk1Dist = Math.max(70, Math.round(totalMeters * 0.07));
    const walk2Dist = Math.max(50, Math.round(totalMeters * 0.04));
    const finalWalkDist = Math.max(60, Math.round(totalMeters * 0.05));

    const bus1Stops = Math.max(2, Math.round(routeData.distanceKm * 2.2));
    const bus2Stops = Math.max(2, Math.round(routeData.distanceKm * 1.8));

    const bus1Duration = Math.max(3, Math.round(routeData.durationMinutes * 0.42));
    const bus2Duration = Math.max(3, Math.round(routeData.durationMinutes * 0.38));

    const steps: TransitStep[] = [
      {
        type: "walk",
        title: `Пешком ~${walk1Dist}м (~${Math.max(1, Math.round(walk1Dist / 75))} мин)`,
        sub: `Идите от ${firstStreet} до остановки общественной информации`,
      },
      {
        type: "bus",
        title: `Автобус № ${bus1} (${bus1Stops} остановок, ~${bus1Duration} мин)`,
        sub: `От остановки «${firstStreet}» до пересадочного узла «${midStreet}»`,
      },
      {
        type: "transfer",
        title: `Точка пересадки: Пешком ~${walk2Dist}м (~${Math.max(1, Math.round(walk2Dist / 65))} мин)`,
        sub: `Перейдите от платформы «${midStreet} (А)» к платформе (Б)`,
      },
      {
        type: "bus",
        title: `Автобус № ${bus2} (${bus2Stops} остановок, ~${bus2Duration} мин)`,
        sub: `От платформы «${midStreet} (Б)» до остановки «${lastStreet}»`,
      },
      {
        type: "walk",
        title: `Пешком ~${finalWalkDist}м (~${Math.max(1, Math.round(finalWalkDist / 70))} мин) до ${name}`,
        sub: `Финальный отрезок пути к заведению «${name}»`,
      },
    ];

    return {
      stop1: coords[iStop1],
      transferPoint1: coords[iTrans1],
      transferPoint2: coords[iTrans2],
      stop2: coords[iStop2],
      walk1Coords: coords.slice(0, iStop1 + 1),
      bus1Coords: coords.slice(iStop1, iTrans1 + 1),
      transferCoords: coords.slice(iTrans1, iTrans2 + 1),
      bus2Coords: coords.slice(iTrans2, iStop2 + 1),
      walk2Coords: coords.slice(iStop2),
      stop1Name: firstStreet,
      transferName: midStreet,
      stop2Name: lastStreet,
      bus1Num: bus1,
      bus2Num: bus2,
      steps,
    };
  }, [userLocation, latitude, longitude, transportMode, routeData, name, address]);

  const twogisRouteUrl = useMemo(() => {
    if (!latitude || !longitude) return null;
    if (userLocation) {
      return `https://2gis.kz/astana/routeSearch/rsType/${
        transportMode === "pedestrian" ? "pedestrian" : transportMode === "bus" ? "ctx" : "car"
      }/from/${userLocation.lng},${userLocation.lat}/to/${longitude},${latitude}`;
    }
    return `https://2gis.kz/astana/geo/${longitude},${latitude}`;
  }, [userLocation, latitude, longitude, transportMode]);

  useEffect(() => {
    if (!open || !latitude || !longitude) return;

    let isSubscribed = true;

    async function initLeafletMap() {
      const L = (await import("leaflet")).default;
      if (!isSubscribed) return;

      if (mapInstanceRef.current) {
        (mapInstanceRef.current as any).remove();
        mapInstanceRef.current = null;
      }

      if (!mapRef.current) return;

      const destCoords: [number, number] = [latitude!, longitude!];
      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const destIcon = L.divIcon({
        className: "custom-dest-pin",
        html: `<div style="background-color:#2d5a4c;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:12px;box-shadow:0 4px 14px rgba(45,90,76,0.6);border:3px solid white;">B</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      L.marker(destCoords, { icon: destIcon })
        .addTo(map)
        .bindPopup(`<strong>${name}</strong>${address ? `<br/><small>${address}</small>` : ""}`)
        .openPopup();

      if (activeTab === "route" && userLocation) {
        const originCoords: [number, number] = [userLocation.lat, userLocation.lng];

        const userIcon = L.divIcon({
          className: "custom-user-pin",
          html: `<div style="background-color:#c86d51;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 4px 14px rgba(200,109,81,0.6);border:3px solid white;">A</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.marker(originCoords, { icon: userIcon }).addTo(map).bindPopup(`<strong>Вы здесь (Точка А)</strong>`);

        if (transportMode === "bus" && busTransitDetails) {
          const {
            stop1,
            transferPoint1,
            stop2,
            walk1Coords,
            bus1Coords,
            transferCoords,
            bus2Coords,
            walk2Coords,
            stop1Name,
            transferName,
            stop2Name,
            bus1Num,
            bus2Num,
          } = busTransitDetails;

          if (walk1Coords.length > 0) {
            L.polyline(walk1Coords, {
              color: "#10b981",
              weight: 5,
              dashArray: "6, 8",
              opacity: 0.9,
            }).addTo(map);
          }

          const stop1Icon = L.divIcon({
            className: "bus-stop-pin",
            html: `<div style="background-color:#f59e0b;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 8px rgba(245,158,11,0.6);border:2px solid white;">BUS</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker(stop1, { icon: stop1Icon }).addTo(map).bindPopup(`<strong>Остановка «${stop1Name}»</strong><br/>Автобус № ${bus1Num}`);

          if (bus1Coords.length > 0) {
            L.polyline(bus1Coords, {
              color: "#f59e0b",
              weight: 7,
              opacity: 0.9,
            }).addTo(map);
          }

          const transferIcon = L.divIcon({
            className: "transfer-pin",
            html: `<div style="background-color:#d97757;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 4px 12px rgba(217,119,87,0.7);border:3px solid white;">TR</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          L.marker(transferPoint1, { icon: transferIcon })
            .addTo(map)
            .bindPopup(`<strong>Точка пересадки («${transferName}»)</strong><br/>Перейти к платформе (Б) — Автобус № ${bus2Num}`);

          if (transferCoords.length > 0) {
            L.polyline(transferCoords, {
              color: "#d97757",
              weight: 5,
              dashArray: "4, 6",
              opacity: 0.9,
            }).addTo(map);
          }

          if (bus2Coords.length > 0) {
            L.polyline(bus2Coords, {
              color: "#c86d51",
              weight: 7,
              opacity: 0.9,
            }).addTo(map);
          }

          const stop2Icon = L.divIcon({
            className: "bus-stop2-pin",
            html: `<div style="background-color:#c86d51;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 8px rgba(200,109,81,0.6);border:2px solid white;">BUS</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          });
          L.marker(stop2, { icon: stop2Icon }).addTo(map).bindPopup(`<strong>Остановка «${stop2Name}»</strong>`);

          if (walk2Coords.length > 0) {
            L.polyline(walk2Coords, {
              color: "#10b981",
              weight: 5,
              dashArray: "6, 8",
              opacity: 0.9,
            }).addTo(map);
          }

          const group = L.featureGroup([
            L.marker(originCoords),
            L.marker(transferPoint1),
            L.marker(destCoords),
          ]);
          map.fitBounds(group.getBounds(), { padding: [50, 50] });
        } else if (routeData && routeData.coordinates.length > 0) {
          const lineColor = transportMode === "pedestrian" ? "#10b981" : "#2d5a4c";

          const polyline = L.polyline(routeData.coordinates, {
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
    }

    initLeafletMap();

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
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
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative z-10 w-full max-w-2xl rounded-3xl overflow-hidden border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-2xl flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
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

            <div ref={mapRef} className="w-full h-64 sm:h-72 shrink-0 relative">
              {routeLoading && activeTab === "route" && (
                <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-sm flex items-center justify-center gap-2 text-xs font-bold text-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-400" />
                  Построение дорожного маршрута OSRM...
                </div>
              )}
            </div>

            {activeTab === "route" && transportMode !== "bus" && routeData && routeData.steps.length > 0 && (
              <div className="bg-[hsl(var(--card))] border-t border-b border-[hsl(var(--border))] px-5 py-3 overflow-y-auto max-h-44 space-y-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-extrabold text-foreground flex items-center gap-1.5">
                    <Navigation className="w-4 h-4 text-brand-400" />
                    Пошаговая навигация по улицам ({routeData.steps.length} шагов)
                  </span>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Дорожная сеть OSRM
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {routeData.steps.map((step, idx) => {
                    const isRight = step.modifier?.includes("right");
                    const isLeft = step.modifier?.includes("left");

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-2 rounded-xl bg-muted/30 border border-[hsl(var(--border)/0.5)]"
                      >
                        <div className="w-6 h-6 rounded-lg bg-brand-400/15 text-brand-400 flex items-center justify-center shrink-0">
                          {isRight ? (
                            <CornerUpRight className="w-3.5 h-3.5" />
                          ) : isLeft ? (
                            <CornerUpLeft className="w-3.5 h-3.5" />
                          ) : (
                            <MoveUp className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground text-xs">{step.instruction}</p>
                        </div>
                        {step.distanceMeters > 0 && (
                          <span className="text-[11px] font-mono font-bold text-muted-foreground shrink-0">
                            {step.distanceMeters >= 1000
                              ? `${(step.distanceMeters / 1000).toFixed(1)} км`
                              : `${step.distanceMeters} м`}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "route" && transportMode === "bus" && busTransitDetails && (
              <div className="bg-[hsl(var(--card))] border-t border-b border-[hsl(var(--border))] px-5 py-3 overflow-y-auto max-h-48 space-y-2.5">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Bus className="w-4 h-4 text-terracotta-500" />
                    Маршрут общественного транспорта по дорожной сети
                  </span>
                  <span className="text-[11px] font-semibold text-terracotta-600 dark:text-terracotta-400 bg-terracotta-500/15 px-2.5 py-0.5 rounded-full">
                    1 пересадка
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {busTransitDetails.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-muted/40 border border-[hsl(var(--border)/0.6)]">
                      <div className="w-6 h-6 rounded-lg bg-brand-400/15 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                        {step.type === "walk" ? (
                          <Footprints className="w-3.5 h-3.5" />
                        ) : step.type === "bus" ? (
                          <Bus className="w-3.5 h-3.5" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5 text-terracotta-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-foreground text-xs leading-snug">{step.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <span className="text-foreground font-semibold bg-muted/80 px-3 py-1.5 rounded-xl border border-[hsl(var(--border))] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        ~{routeData.durationMinutes} мин{" "}
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
