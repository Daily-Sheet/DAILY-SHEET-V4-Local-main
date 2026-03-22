/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";

export interface PlaceResult {
  address: string;
  lat: string;
  lng: string;
  name?: string;
}

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
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.onload = () => { googleMapsLoaded = true; resolve(); };
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return googleMapsPromise;
}

export function PlacesAutocomplete({
  value,
  onChange,
  onPlaceSelect,
  placeholder = "Search for a venue or address...",
  "data-testid": testId,
}: {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  placeholder?: string;
  "data-testid"?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [ready, setReady] = useState(googleMapsLoaded);
  const { data: config } = useGoogleMapsKey();

  useEffect(() => {
    if (!config?.apiKey) return;
    loadGoogleMaps(config.apiKey).then(() => setReady(true)).catch(() => {});
  }, [config?.apiKey]);

  useEffect(() => {
    if (!ready || !inputRef.current || autocompleteRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["establishment", "geocode"],
      fields: ["formatted_address", "geometry", "name"],
    });

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      if (!place.geometry?.location) return;
      const result: PlaceResult = {
        address: place.formatted_address || "",
        lat: place.geometry.location.lat().toString(),
        lng: place.geometry.location.lng().toString(),
        name: place.name,
      };
      onChange(result.address);
      onPlaceSelect?.(result);
    });

    autocompleteRef.current = ac;
  }, [ready]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      data-testid={testId}
    />
  );
}
