import { getBasemap, type BasemapId, type BasemapLayer } from "@/app/lib/basemaps";
import { DEFAULT_PERSON_COLOR, normalizePlanColor } from "@/app/lib/colors";
import { MEETING_POINT_LEGEND } from "@/app/lib/roles";
import { getPlannedRoutePaths } from "@/app/lib/routing";
import type { MeetingPoint, Person, PlannedRoute } from "@/app/types";

const TILE_SIZE = 256;
const MAX_CONCURRENT_TILES = 8;

export type MapExportPoint = {
  lat: number;
  lng: number;
  label: string;
  color: string;
};

function latLngToWorldPixel(lat: number, lng: number, zoom: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const y =
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale;
  return { x, y };
}

function getContentBounds(people: Person[], meetingPoints: MeetingPoint[]) {
  const points: { lat: number; lng: number }[] = [
    ...people.map((person) => ({ lat: person.lat, lng: person.lng })),
    ...meetingPoints.map((point) => ({ lat: point.lat, lng: point.lng })),
  ];

  if (points.length === 0) {
    return {
      north: 60.2,
      south: 60.14,
      east: 25.0,
      west: 24.88,
    };
  }

  let north = -90;
  let south = 90;
  let east = -180;
  let west = 180;

  for (const point of points) {
    north = Math.max(north, point.lat);
    south = Math.min(south, point.lat);
    east = Math.max(east, point.lng);
    west = Math.min(west, point.lng);
  }

  // Pad tiny clusters so a single pin still shows neighborhood context.
  if (Math.abs(north - south) < 0.002) {
    north += 0.01;
    south -= 0.01;
  }
  if (Math.abs(east - west) < 0.002) {
    east += 0.01;
    west -= 0.01;
  }

  return { north, south, east, west };
}

function chooseZoomForBounds(
  bounds: ReturnType<typeof getContentBounds>,
  widthPx: number,
  heightPx: number,
  paddingPx: number,
  maxZoom: number
) {
  const usableWidth = Math.max(1, widthPx - paddingPx * 2);
  const usableHeight = Math.max(1, heightPx - paddingPx * 2);

  for (let zoom = maxZoom; zoom >= 1; zoom -= 1) {
    const nw = latLngToWorldPixel(bounds.north, bounds.west, zoom);
    const se = latLngToWorldPixel(bounds.south, bounds.east, zoom);
    const spanX = Math.abs(se.x - nw.x);
    const spanY = Math.abs(se.y - nw.y);
    if (spanX <= usableWidth && spanY <= usableHeight) {
      return zoom;
    }
  }

  return 1;
}

function buildTileUrl(
  layer: BasemapLayer,
  zoom: number,
  x: number,
  y: number,
  subdomainIndex: number
) {
  const subdomains = String(layer.subdomains ?? "abc");
  const subdomain = subdomains[subdomainIndex % subdomains.length] ?? "a";

  return layer.url
    .replace("{s}", subdomain)
    .replace("{z}", String(zoom))
    .replace("{x}", String(x))
    .replace("{y}", String(y));
}

function loadTileImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function run() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () =>
    run()
  );
  await Promise.all(runners);
  return results;
}

async function drawTileLayer(
  ctx: CanvasRenderingContext2D,
  layer: BasemapLayer,
  zoom: number,
  topLeftX: number,
  topLeftY: number,
  widthPx: number,
  heightPx: number
) {
  const tileMinX = Math.floor(topLeftX / TILE_SIZE);
  const tileMinY = Math.floor(topLeftY / TILE_SIZE);
  const tileMaxX = Math.floor((topLeftX + widthPx) / TILE_SIZE);
  const tileMaxY = Math.floor((topLeftY + heightPx) / TILE_SIZE);
  const maxIndex = 2 ** zoom;

  const jobs: { x: number; y: number; url: string }[] = [];

  for (let ty = tileMinY; ty <= tileMaxY; ty += 1) {
    for (let tx = tileMinX; tx <= tileMaxX; tx += 1) {
      if (ty < 0 || ty >= maxIndex) continue;
      const wrappedX = ((tx % maxIndex) + maxIndex) % maxIndex;
      jobs.push({
        x: tx,
        y: ty,
        url: buildTileUrl(layer, zoom, wrappedX, ty, jobs.length),
      });
    }
  }

  await mapPool(jobs, MAX_CONCURRENT_TILES, async (job) => {
    const image = await loadTileImage(job.url);
    if (!image) return null;

    const drawX = job.x * TILE_SIZE - topLeftX;
    const drawY = job.y * TILE_SIZE - topLeftY;
    ctx.drawImage(image, drawX, drawY, TILE_SIZE, TILE_SIZE);
    return null;
  });
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  color: string
) {
  const radius = 32;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  const text = label.trim().slice(0, 4) || "•";
  const fontSize = text.length <= 2 ? 26 : text.length === 3 ? 22 : 18;
  ctx.font = `700 ${fontSize}px Arial, Helvetica, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y + 0.5);
}

export function collectExportMarkers(
  people: Person[],
  meetingPoints: MeetingPoint[]
): MapExportPoint[] {
  const personMarkers = people.map((person) => ({
    lat: person.lat,
    lng: person.lng,
    label: person.label || "•",
    color: normalizePlanColor(person.color, DEFAULT_PERSON_COLOR),
  }));

  const meetingMarkers = meetingPoints.map((point) => ({
    lat: point.lat,
    lng: point.lng,
    label: "M",
    color: MEETING_POINT_LEGEND.color,
  }));

  return [...personMarkers, ...meetingMarkers];
}

function drawRoute(
  ctx: CanvasRenderingContext2D,
  coordinates: { lat: number; lng: number }[],
  zoom: number,
  topLeftX: number,
  topLeftY: number,
  isFallback: boolean,
  color: string
) {
  if (coordinates.length < 2) return;

  ctx.beginPath();
  coordinates.forEach((coordinate, index) => {
    const point = latLngToWorldPixel(coordinate.lat, coordinate.lng, zoom);
    const x = point.x - topLeftX;
    const y = point.y - topLeftY;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  if (isFallback) {
    ctx.setLineDash([14, 12]);
  } else {
    ctx.setLineDash([]);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
}

/**
 * Render a high-resolution map by stitching Leaflet-compatible tiles
 * (not a DOM screenshot). This keeps street detail when the view is wide.
 */
export async function renderMapCanvas(options: {
  people: Person[];
  meetingPoints: MeetingPoint[];
  routes?: PlannedRoute[];
  basemap: BasemapId;
  widthPx: number;
  heightPx: number;
  paddingPx?: number;
}): Promise<HTMLCanvasElement> {
  const {
    people,
    meetingPoints,
    routes: plannedRoutes = [],
    basemap,
    widthPx,
    heightPx,
    paddingPx = 72,
  } = options;

  const definition = getBasemap(basemap);
  const bounds = getContentBounds(people, meetingPoints);
  const zoom = chooseZoomForBounds(
    bounds,
    widthPx,
    heightPx,
    paddingPx,
    definition.base.maxZoom
  );

  const nw = latLngToWorldPixel(bounds.north, bounds.west, zoom);
  const se = latLngToWorldPixel(bounds.south, bounds.east, zoom);
  const contentWidth = Math.max(1, se.x - nw.x);
  const contentHeight = Math.max(1, se.y - nw.y);

  const topLeftX = nw.x - (widthPx - contentWidth) / 2;
  const topLeftY = nw.y - (heightPx - contentHeight) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not create map export canvas.");
  }

  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, widthPx, heightPx);

  await drawTileLayer(
    ctx,
    definition.base,
    zoom,
    topLeftX,
    topLeftY,
    widthPx,
    heightPx
  );

  if (definition.overlay) {
    await drawTileLayer(
      ctx,
      definition.overlay,
      zoom,
      topLeftX,
      topLeftY,
      widthPx,
      heightPx
    );
  }

  const routes = await getPlannedRoutePaths(
    plannedRoutes,
    people,
    meetingPoints
  );
  for (const route of routes) {
    drawRoute(
      ctx,
      route.coordinates,
      zoom,
      topLeftX,
      topLeftY,
      route.isFallback,
      route.color
    );
  }

  for (const marker of collectExportMarkers(people, meetingPoints)) {
    const point = latLngToWorldPixel(marker.lat, marker.lng, zoom);
    drawMarker(
      ctx,
      point.x - topLeftX,
      point.y - topLeftY,
      marker.label,
      marker.color
    );
  }

  return canvas;
}

/** Target pixel size for tabloid content area (~300 DPI print). */
export function getMapExportPixelSize(orientation: "portrait" | "landscape") {
  const dpi = 300;
  const marginMm = 12;
  const pageWidthMm = orientation === "landscape" ? 431.8 : 279.4;
  const pageHeightMm = orientation === "landscape" ? 279.4 : 431.8;
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;

  return {
    widthPx: Math.round((contentWidthMm / 25.4) * dpi),
    heightPx: Math.round((contentHeightMm / 25.4) * dpi),
  };
}

export function clampExportZoomRelated(
  widthPx: number,
  heightPx: number
): { widthPx: number; heightPx: number } {
  // Allow larger canvases for ~300 DPI tabloid export.
  const maxEdge = 5600;
  const scale = Math.min(1, maxEdge / Math.max(widthPx, heightPx));
  return {
    widthPx: Math.round(widthPx * scale),
    heightPx: Math.round(heightPx * scale),
  };
}
