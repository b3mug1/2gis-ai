"use client";

import { useState, useEffect, useCallback } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

const DEFAULT_LOCATION: UserLocation = { lat: 51.1801, lng: 71.4460 }; // Astana default

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setError("Геолокация не поддерживается вашим браузером");
      setLocation(DEFAULT_LOCATION);
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let msg = "Не удалось определить местоположение";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Доступ к геопозиции отклонен";
        }
        setError(msg);
        setLocation(DEFAULT_LOCATION);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return {
    location: location || DEFAULT_LOCATION,
    hasRealLocation: !!location && location !== DEFAULT_LOCATION,
    loading,
    error,
    requestLocation,
  };
}
