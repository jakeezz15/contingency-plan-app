import type { MeetingPoint, Person } from "@/app/types";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(toRadians(a.lat)) *
      Math.cos(toRadians(b.lat)) *
      sinLng *
      sinLng;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function formatDistanceKm(km: number) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }

  return `${km.toFixed(1)} km`;
}

export type NearestMeetingPoint = {
  point: MeetingPoint;
  distanceKm: number;
};

export function findNearestMeetingPoint(
  person: Person,
  meetingPoints: MeetingPoint[]
): NearestMeetingPoint | null {
  if (meetingPoints.length === 0) return null;

  let nearest: NearestMeetingPoint | null = null;

  for (const point of meetingPoints) {
    const distanceKm = haversineDistanceKm(person, point);

    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { point, distanceKm };
    }
  }

  return nearest;
}
