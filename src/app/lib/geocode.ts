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
