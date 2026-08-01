import { haversineDistanceKm } from "@/app/lib/geo";
import { DEFAULT_PERSON_COLOR, normalizePlanColor } from "@/app/lib/colors";
import type { Person } from "@/app/types";

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

export type PersonLocationGroup = {
  id: number;
  lat: number;
  lng: number;
  address: string;
  pinLabel: string;
  pinColor: string;
  /** Household entries that share this pin (usually one). */
  households: Person[];
};

const OVERLAP_THRESHOLD_M = 50;
const SAME_PLACE_THRESHOLD_M = 10;
const SPREAD_RADIUS_M = 28;
const METERS_PER_DEGREE_LAT = 111_320;
const MAX_PIN_LABEL_LENGTH = 4;

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

/** Build pin text from household labels at one place (usually a single label). */
export function formatGroupPinLabel(households: Person[]): string {
  const labels = households
    .map((household) => household.label.trim())
    .filter(Boolean);

  if (labels.length === 0) {
    return "•";
  }

  // Prefer a single shared label when every household uses the same one.
  const unique = [...new Set(labels)];
  if (unique.length === 1) {
    return unique[0].slice(0, MAX_PIN_LABEL_LENGTH);
  }

  const joined = unique.join(",");
  if (joined.length <= MAX_PIN_LABEL_LENGTH) {
    return joined;
  }

  return `${unique[0].slice(0, 2)}+${unique.length - 1}`;
}

/** Group households within ~10m into a single shared-address cluster. */
export function groupPeopleByLocation(
  people: Person[],
  thresholdM = SAME_PLACE_THRESHOLD_M
): PersonLocationGroup[] {
  if (people.length === 0) {
    return [];
  }

  const clusters = groupOverlappingMarkers(people, thresholdM);

  return clusters.map((households) => {
    const lat =
      households.reduce((sum, person) => sum + person.lat, 0) /
      households.length;
    const lng =
      households.reduce((sum, person) => sum + person.lng, 0) /
      households.length;
    const address =
      households.find((person) => person.address.trim())?.address ??
      households[0].address;

    return {
      id: households[0].id,
      lat,
      lng,
      address,
      households,
      pinLabel: formatGroupPinLabel(households),
      pinColor: normalizePlanColor(
        households[0].color,
        DEFAULT_PERSON_COLOR
      ),
    };
  });
}
