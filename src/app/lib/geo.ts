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

export type MeetingPointDistance = {
  point: MeetingPoint;
  distanceKm: number;
};

export function getMeetingPointsByDistance(
  person: Person,
  meetingPoints: MeetingPoint[]
): MeetingPointDistance[] {
  return meetingPoints
    .map((point) => ({
      point,
      distanceKm: haversineDistanceKm(person, point),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export function findNearestMeetingPoint(
  person: Person,
  meetingPoints: MeetingPoint[]
): MeetingPointDistance | null {
  const ranked = getMeetingPointsByDistance(person, meetingPoints);
  return ranked[0] ?? null;
}
