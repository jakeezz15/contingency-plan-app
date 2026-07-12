import { haversineDistanceKm } from "@/app/lib/geo";

type MapCoordinate = {
  lat: number;
  lng: number;
};

type MapMarker = MapCoordinate & {
  id: number;
};

export type DisplayPositionedMarker<T extends MapMarker> = T & {
  displayLat: number;
  displayLng: number;
};

const OVERLAP_THRESHOLD_M = 50;
const SPREAD_RADIUS_M = 28;
const METERS_PER_DEGREE_LAT = 111_320;

function metersToLatOffset(meters: number) {
  return meters / METERS_PER_DEGREE_LAT;
}

function metersToLngOffset(meters: number, latitude: number) {
  const metersPerDegreeLng =
    METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);

  if (metersPerDegreeLng === 0) {
    return 0;
  }

  return meters / metersPerDegreeLng;
}

function distanceMeters(a: MapCoordinate, b: MapCoordinate) {
  return haversineDistanceKm(a, b) * 1000;
}

function groupOverlappingMarkers<T extends MapMarker>(
  markers: T[],
  thresholdM: number
): T[][] {
  const groups: T[][] = [];
  const assigned = new Set<number>();

  for (const marker of markers) {
    if (assigned.has(marker.id)) {
      continue;
    }

    const group = [marker];
    assigned.add(marker.id);

    let changed = true;
    while (changed) {
      changed = false;

      for (const candidate of markers) {
        if (assigned.has(candidate.id)) {
          continue;
        }

        const isClose = group.some(
          (member) => distanceMeters(member, candidate) < thresholdM
        );

        if (isClose) {
          group.push(candidate);
          assigned.add(candidate.id);
          changed = true;
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

function spreadMarkerGroup<T extends MapMarker>(
  markers: T[],
  spreadRadiusM: number
): DisplayPositionedMarker<T>[] {
  if (markers.length === 1) {
    const [marker] = markers;
    return [{ ...marker, displayLat: marker.lat, displayLng: marker.lng }];
  }

  const centerLat =
    markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length;
  const centerLng =
    markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length;

  return markers.map((marker, index) => {
    const angle = (2 * Math.PI * index) / markers.length - Math.PI / 2;
    const offsetLat = metersToLatOffset(spreadRadiusM * Math.sin(angle));
    const offsetLng = metersToLngOffset(
      spreadRadiusM * Math.cos(angle),
      centerLat
    );

    return {
      ...marker,
      displayLat: centerLat + offsetLat,
      displayLng: centerLng + offsetLng,
    };
  });
}

export function spreadOverlappingMarkers<T extends MapMarker>(
  markers: T[],
  thresholdM = OVERLAP_THRESHOLD_M,
  spreadRadiusM = SPREAD_RADIUS_M
): DisplayPositionedMarker<T>[] {
  if (markers.length <= 1) {
    return markers.map((marker) => ({
      ...marker,
      displayLat: marker.lat,
      displayLng: marker.lng,
    }));
  }

  return groupOverlappingMarkers(markers, thresholdM).flatMap((group) =>
    spreadMarkerGroup(group, spreadRadiusM)
  );
}
