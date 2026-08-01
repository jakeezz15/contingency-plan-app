import { haversineDistanceKm } from "@/app/lib/geo";
import type {
  MeetingPoint,
  Person,
  PlannedRoute,
  RouteEndpointRef,
} from "@/app/types";

import {
  DEFAULT_ROUTE_COLOR,
  isPlanColor,
  PLAN_COLOR_OPTIONS,
  suggestNextPlanColor,
  normalizePlanColor,
} from "@/app/lib/colors";

export type LatLng = { lat: number; lng: number };

export type RoutePath = {
  id: string;
  from: RouteEndpointRef;
  to: RouteEndpointRef;
  fromLabel: string;
  toLabel: string;
  color: string;
  coordinates: LatLng[];
  distanceKm: number;
  /** True when OSRM failed and we drew a straight line instead. */
  isFallback: boolean;
};

/** @deprecated Prefer PLAN_COLOR_OPTIONS from colors.ts */
export const ROUTE_COLOR_OPTIONS = PLAN_COLOR_OPTIONS;

export function isRouteColor(value: string): boolean {
  return isPlanColor(value);
}

export function normalizeRouteColor(value: unknown): string {
  return normalizePlanColor(value, DEFAULT_ROUTE_COLOR);
}

export function suggestNextRouteColor(existingColors: string[]): string {
  return suggestNextPlanColor(existingColors);
}

type CacheEntry = {
  coordinates: LatLng[];
  distanceKm: number;
  isFallback: boolean;
};

const routeCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();

function roundCoord(value: number) {
  return value.toFixed(5);
}

function cacheKey(from: LatLng, to: LatLng) {
  return `${roundCoord(from.lat)},${roundCoord(from.lng)}>${roundCoord(to.lat)},${roundCoord(to.lng)}`;
}

function straightLineFallback(from: LatLng, to: LatLng): CacheEntry {
  return {
    coordinates: [from, to],
    distanceKm: haversineDistanceKm(from, to),
    isFallback: true,
  };
}

export function endpointKey(endpoint: RouteEndpointRef) {
  return `${endpoint.kind}:${endpoint.id}`;
}

export function parseEndpointKey(value: string): RouteEndpointRef | null {
  const [kind, idText] = value.split(":");
  const id = Number(idText);
  if (!Number.isFinite(id)) return null;
  if (kind === "person" || kind === "meeting") {
    return { kind, id };
  }
  return null;
}

export function resolveEndpoint(
  endpoint: RouteEndpointRef,
  people: Person[],
  meetingPoints: MeetingPoint[]
): { point: LatLng; label: string } | null {
  if (endpoint.kind === "person") {
    const person = people.find((entry) => entry.id === endpoint.id);
    if (!person) return null;
    return {
      point: { lat: person.lat, lng: person.lng },
      label: `Pin ${person.label || "—"}`,
    };
  }

  const meeting = meetingPoints.find((entry) => entry.id === endpoint.id);
  if (!meeting) return null;
  return {
    point: { lat: meeting.lat, lng: meeting.lng },
    label: meeting.name.trim() || "Meeting point",
  };
}

export function listRouteEndpointOptions(
  people: Person[],
  meetingPoints: MeetingPoint[]
) {
  return [
    ...people.map((person) => ({
      key: endpointKey({ kind: "person", id: person.id }),
      label: `Pin ${person.label || "—"}`,
      group: "People",
    })),
    ...meetingPoints.map((point) => ({
      key: endpointKey({ kind: "meeting", id: point.id }),
      label: point.name.trim() || "Meeting point",
      group: "Meeting points",
    })),
  ];
}

async function fetchDrivingRoute(from: LatLng, to: LatLng): Promise<CacheEntry> {
  const key = cacheKey(from, to);
  const cached = routeCache.get(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const request = (async () => {
    try {
      const url =
        `https://router.project-osrm.org/route/v1/driving/` +
        `${from.lng},${from.lat};${to.lng},${to.lat}` +
        `?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Routing failed (${response.status})`);
      }

      const data = (await response.json()) as {
        code?: string;
        routes?: {
          distance?: number;
          geometry?: { coordinates?: [number, number][] };
        }[];
      };

      const route = data.routes?.[0];
      const geometry = route?.geometry?.coordinates;

      if (data.code !== "Ok" || !geometry || geometry.length < 2) {
        throw new Error("No route geometry returned");
      }

      const entry: CacheEntry = {
        coordinates: geometry.map(([lng, lat]) => ({ lat, lng })),
        distanceKm: (route?.distance ?? 0) / 1000,
        isFallback: false,
      };
      routeCache.set(key, entry);
      return entry;
    } catch {
      const fallback = straightLineFallback(from, to);
      routeCache.set(key, fallback);
      return fallback;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, request);
  return request;
}

function sameEndpoint(a: RouteEndpointRef, b: RouteEndpointRef) {
  return a.kind === b.kind && a.id === b.id;
}

/** Drop routes that reference missing pins/meeting points. */
export function prunePlannedRoutes(
  routes: PlannedRoute[],
  people: Person[],
  meetingPoints: MeetingPoint[]
): PlannedRoute[] {
  const personIds = new Set(people.map((person) => person.id));
  const meetingIds = new Set(meetingPoints.map((point) => point.id));

  return routes.filter((route) => {
    const fromOk =
      route.from.kind === "person"
        ? personIds.has(route.from.id)
        : meetingIds.has(route.from.id);
    const toOk =
      route.to.kind === "person"
        ? personIds.has(route.to.id)
        : meetingIds.has(route.to.id);
    return fromOk && toOk && !sameEndpoint(route.from, route.to);
  });
}

function normalizeRouteEndpoint(raw: unknown): RouteEndpointRef | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Partial<RouteEndpointRef>;
  if (
    (data.kind === "person" || data.kind === "meeting") &&
    typeof data.id === "number"
  ) {
    return { kind: data.kind, id: data.id };
  }
  return null;
}

export function normalizePlannedRoutes(raw: unknown): PlannedRoute[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry, index) => {
    if (!entry || typeof entry !== "object") return [];
    const data = entry as Partial<PlannedRoute>;
    const from = normalizeRouteEndpoint(data.from);
    const to = normalizeRouteEndpoint(data.to);
    if (!from || !to || sameEndpoint(from, to)) return [];

    return [
      {
        id:
          typeof data.id === "string" && data.id
            ? data.id
            : `route-${index}-${Date.now()}`,
        from,
        to,
        color: normalizeRouteColor(data.color),
      },
    ];
  });
}

/** Resolve and fetch geometries for user-defined planned routes. */
export async function getPlannedRoutePaths(
  plannedRoutes: PlannedRoute[],
  people: Person[],
  meetingPoints: MeetingPoint[]
): Promise<RoutePath[]> {
  const valid = prunePlannedRoutes(plannedRoutes, people, meetingPoints);

  const paths = await Promise.all(
    valid.map(async (route) => {
      const from = resolveEndpoint(route.from, people, meetingPoints);
      const to = resolveEndpoint(route.to, people, meetingPoints);
      if (!from || !to) return null;

      const path = await fetchDrivingRoute(from.point, to.point);

      return {
        id: route.id,
        from: route.from,
        to: route.to,
        fromLabel: from.label,
        toLabel: to.label,
        color: normalizeRouteColor(route.color),
        coordinates: path.coordinates,
        distanceKm: path.distanceKm,
        isFallback: path.isFallback,
      } satisfies RoutePath;
    })
  );

  return paths.filter((path): path is RoutePath => path !== null);
}
