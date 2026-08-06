"use client";

import { useEffect, useRef } from "react";
import type { PlaceRecommendation } from "@/types/api";

interface MapViewProps {
  places: PlaceRecommendation[];
  center?: { lat: number; lng: number };
}

declare global {
  interface Window {
    DG: {
      map: (el: HTMLElement, opts: Record<string, unknown>) => DGMap;
      marker: (coords: [number, number]) => DGMarker;
      popup: () => DGPopup;
      latLng: (lat: number, lng: number) => unknown;
    };
  }
}

interface DGMap {
  remove(): void;
}
interface DGMarker {
  addTo(map: DGMap): DGMarker;
  bindPopup(popup: DGPopup): DGMarker;
}
interface DGPopup {
  setContent(html: string): DGPopup;
}

const ASTANA_CENTER = { lat: 51.1801, lng: 71.4460 };

export function MapView({ places, center }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<DGMap | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_TWOGIS_API_KEY;
    const scriptId = "2gis-maps-script";

    function initMap() {
      if (!containerRef.current || !window.DG) return;
      if (mapRef.current) {
        mapRef.current.remove();
      }
      const firstValidCoords = places.find((p) => p.latitude != null && p.longitude != null);
      const mapCenter = firstValidCoords
        ? { lat: firstValidCoords.latitude!, lng: firstValidCoords.longitude! }
        : center ?? ASTANA_CENTER;

      mapRef.current = window.DG.map(containerRef.current, {
        center: [mapCenter.lat, mapCenter.lng],
        zoom: 13,
      });

      places.forEach((place) => {
        // Use exact coordinates from 2GIS API if available
        if (place.latitude == null || place.longitude == null) return;

        const lat = place.latitude;
        const lng = place.longitude;

        const popup = window.DG.popup().setContent(
          `<div style="font-family:sans-serif;max-width:200px">
            <strong style="font-size:13px">${place.name}</strong>
            ${place.address ? `<p style="font-size:11px;margin:4px 0;color:#666">${place.address}</p>` : ""}
            ${place.rating ? `<span style="font-size:11px">⭐ ${place.rating.toFixed(1)}</span>` : ""}
          </div>`
        );

        window.DG.marker([lat, lng]).addTo(mapRef.current!).bindPopup(popup);
      });
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
    <div className="w-full h-full rounded-2xl overflow-hidden border border-[hsl(var(--border))] relative">
      <div ref={containerRef} className="w-full h-full" />
      {places.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[hsl(var(--muted))] text-muted-foreground text-sm">
          Map will show results here
        </div>
      )}
    </div>
  );
}
