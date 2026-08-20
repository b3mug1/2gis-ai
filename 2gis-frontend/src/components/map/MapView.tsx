"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { PlaceRecommendation } from "@/types/api";
import { MapModal } from "@/components/map/MapModal";

interface MapViewProps {
  places: PlaceRecommendation[];
  center?: { lat: number; lng: number };
}

declare global {
  interface Window {
    DG: {
      map: (el: HTMLElement, opts: Record<string, unknown>) => DGMap;
      marker: (coords: [number, number], opts?: Record<string, unknown>) => DGMarker;
      popup: (opts?: Record<string, unknown>) => DGPopup;
      latLngBounds: (bounds: [number, number][]) => DGBounds;
      featureGroup: (markers: DGMarker[]) => DGFeatureGroup;
      latLng: (lat: number, lng: number) => unknown;
    };
    __2gisBuildRoute?: (placeId: string) => void;
  }
}

interface DGMap {
  remove(): void;
  fitBounds(bounds: DGBounds | unknown, opts?: Record<string, unknown>): void;
}
interface DGMarker {
  addTo(map: DGMap): DGMarker;
  bindPopup(popup: DGPopup | string): DGMarker;
  openPopup(): DGMarker;
  on(event: string, fn: () => void): DGMarker;
}
interface DGPopup {
  setContent(html: string): DGPopup;
}
interface DGBounds {}
interface DGFeatureGroup {
  getBounds(): DGBounds;
}

const ASTANA_CENTER = { lat: 51.1801, lng: 71.4460 };

export function MapView({ places, center }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DGMap | null>(null);
  const [selectedRoutePlace, setSelectedRoutePlace] = useState<PlaceRecommendation | null>(null);

  const handleBuildRoute = useCallback((placeId: string) => {
    const found = places.find((p) => p.place_id === placeId);
    if (found) {
      setSelectedRoutePlace(found);
    }
  }, [places]);

  useEffect(() => {
    window.__2gisBuildRoute = handleBuildRoute;
    return () => {
      delete window.__2gisBuildRoute;
    };
  }, [handleBuildRoute]);

  useEffect(() => {
    const apiKey =
      (typeof import.meta !== "undefined" && import.meta.env?.VITE_TWOGIS_API_KEY) ||
      (typeof import.meta !== "undefined" && import.meta.env?.NEXT_PUBLIC_TWOGIS_API_KEY) ||
      "";
    const scriptId = "2gis-maps-script";

    function initMap() {
      if (!containerRef.current || !window.DG) return;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const validPlaces = places.filter((p) => p.latitude != null && p.longitude != null);
      const mapCenter = validPlaces.length > 0
        ? { lat: validPlaces[0].latitude!, lng: validPlaces[0].longitude! }
        : center ?? ASTANA_CENTER;

      const map = window.DG.map(containerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 13,
        zoomControl: true,
        fullscreenControl: false,
      });

      mapRef.current = map;

      const markers: DGMarker[] = [];

      validPlaces.forEach((place) => {
        const lat = place.latitude!;
        const lng = place.longitude!;

        const popupContent = `
          <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;padding:6px;min-width:200px;background:#052659;color:#C1E8FF;border-radius:12px;">
            <strong style="font-size:13px;font-weight:700;color:#C1E8FF;display:block;margin-bottom:3px;line-height:1.3;">${place.name}</strong>
            ${place.address ? `<p style="font-size:11px;color:#7DA0CA;margin:0 0 8px 0;line-height:1.3;">${place.address}</p>` : ""}
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:6px;">
              ${place.rating ? `<span style="font-size:12px;font-weight:700;color:#C1E8FF;">★ ${place.rating.toFixed(1)}</span>` : "<span></span>"}
              <button
                onclick="window.__2gisBuildRoute && window.__2gisBuildRoute('${place.place_id}')"
                style="background:#C1E8FF;color:#021024;border:none;padding:5px 10px;border-radius:9999px;font-size:11px;font-weight:700;cursor:pointer;transition:transform 0.15s;"
              >
                Маршрут
              </button>
            </div>
          </div>
        `;

        const popup = window.DG.popup({ minWidth: 180 }).setContent(popupContent);
        const marker = window.DG.marker([lat, lng], { clickable: true })
          .addTo(map)
          .bindPopup(popup);

        marker.on("click", () => {
          marker.openPopup();
        });

        markers.push(marker);
      });

      if (markers.length > 0 && window.DG.featureGroup) {
        try {
          const group = window.DG.featureGroup(markers);
          map.fitBounds(group.getBounds(), { padding: [40, 40] });
        } catch {}
      }
    }

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.api.2gis.ru/2.0/loader.js?pkg=full&skin=light${apiKey ? `&key=${apiKey}` : ""}`;
      script.onload = initMap;
      document.head.appendChild(script);
    } else if (window.DG) {
      initMap();
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [places, center]);

  return (
    <>
      <div className="w-full h-full rounded-[1.5rem] overflow-hidden border border-[hsl(var(--border))] relative shadow-lg bg-[hsl(var(--card))]">
        <div ref={containerRef} className="w-full h-full cursor-pointer" />
        {places.length === 0 && (
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.85)] px-4 py-2 text-xs font-medium text-[hsl(var(--muted-foreground))] backdrop-blur-md">
            <span>Астана · Интерактивная карта 2GIS</span>
            <span className="text-[hsl(var(--primary))] font-semibold">Live</span>
          </div>
        )}
      </div>

      {selectedRoutePlace && (
        <MapModal
          open={!!selectedRoutePlace}
          onClose={() => setSelectedRoutePlace(null)}
          name={selectedRoutePlace.name}
          address={selectedRoutePlace.address}
          latitude={selectedRoutePlace.latitude}
          longitude={selectedRoutePlace.longitude}
          initialBuildRoute={true}
        />
      )}
    </>
  );
}
