import type { GeocodeResult } from "@/app/types";

export async function geocodeAddress(query: string): Promise<GeocodeResult> {
  const response = await fetch(
    `/api/geocode?q=${encodeURIComponent(query.trim())}`
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Geocoding failed"
    );
  }

  return data as GeocodeResult;
}

export function formatMapPinLabel(lat: number, lng: number) {
  return `Map pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const response = await fetch(
    `/api/reverse-geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Could not look up this map point"
    );
  }

  return data as GeocodeResult;
}
