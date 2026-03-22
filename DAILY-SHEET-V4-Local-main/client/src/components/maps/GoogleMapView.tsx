/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

function useGoogleMapsKey() {
  return useQuery<{ apiKey: string }>({
    queryKey: ["/api/config/maps"],
    staleTime: Infinity,
  });
}

let googleMapsPromise: Promise<void> | null = null;
let googleMapsLoaded = false;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (googleMapsLoaded) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    if (typeof google !== "undefined" && google.maps) {
      googleMapsLoaded = true;
      return resolve();
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener("load", () => { googleMapsLoaded = true; resolve(); });
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker`;
    script.async = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

export interface MapMarker {
  lat: number;
  lng: number;
  title?: string;
  label?: string;
  onClick?: () => void;
}

export function GoogleMapView({
  center,
  zoom = 14,
  markers = [],
  height = 200,
  interactive = true,
  className,
  "data-testid": testId,
}: {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[];
  height?: number | string;
  interactive?: boolean;
  className?: string;
  "data-testid"?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const [ready, setReady] = useState(googleMapsLoaded);
  const { data: config } = useGoogleMapsKey();

  useEffect(() => {
    if (!config?.apiKey) return;
    loadGoogleMaps(config.apiKey).then(() => setReady(true)).catch(() => {});
  }, [config?.apiKey]);

  // Initialize map
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current) return;

    const mapCenter = center || (markers.length > 0
      ? { lat: markers[0].lat, lng: markers[0].lng }
      : { lat: 0, lng: 0 });

    mapRef.current = new google.maps.Map(containerRef.current, {
      center: mapCenter,
      zoom,
      disableDefaultUI: !interactive,
      gestureHandling: interactive ? "auto" : "none",
      zoomControl: interactive,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    infoWindowRef.current = new google.maps.InfoWindow();
  }, [ready]);

  // Update markers
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasMarkers = false;

    for (const m of markers) {
      const marker = new google.maps.Marker({
        position: { lat: m.lat, lng: m.lng },
        map: mapRef.current,
        title: m.title,
        label: m.label,
      });

      if (m.title) {
        marker.addListener("click", () => {
          infoWindowRef.current?.setContent(m.title!);
          infoWindowRef.current?.open(mapRef.current!, marker);
          m.onClick?.();
        });
      } else if (m.onClick) {
        marker.addListener("click", m.onClick);
      }

      markersRef.current.push(marker);
      bounds.extend({ lat: m.lat, lng: m.lng });
      hasMarkers = true;
    }

    // Fit bounds if multiple markers, otherwise center on single marker
    if (hasMarkers && markers.length > 1 && !center) {
      mapRef.current.fitBounds(bounds, 50);
    } else if (center) {
      mapRef.current.setCenter(center);
      mapRef.current.setZoom(zoom);
    }
  }, [markers, center, zoom, ready]);

  if (!config?.apiKey) {
    return (
      <div
        className={className}
        style={{ height, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--muted)" }}
        data-testid={testId}
      >
        <span className="text-sm text-muted-foreground">Map unavailable</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ height, width: "100%" }}
      data-testid={testId}
    />
  );
}
