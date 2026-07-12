"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { formatCompactAddress } from "@/app/lib/address";
import {
  getRoleDefinition,
  MEETING_POINT_LEGEND,
  type RoleDefinition,
} from "@/app/lib/roles";
import type { MeetingPoint, Person, SelectedLocation } from "@/app/types";
import { PREPARE_MAP_PRINT_EVENT } from "@/app/lib/mapPrint";

type LegendSize = "default" | "compact";
type LegendPlacement = "overlay" | "below";

type MapPickerProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation?: SelectedLocation;
  large?: boolean;
  showLegend?: boolean;
  legendSize?: LegendSize;
  legendPlacement?: LegendPlacement;
  mapKey?: string;
  className?: string;
  enablePrintPrepare?: boolean;
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const roleIconCache = new Map<string, L.DivIcon>();
const labeledMarkerIconCache = new Map<string, L.DivIcon>();

const MARKER_PIN_SIZE = 32;
const MARKER_LABEL_MAX_WIDTH = 76;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createMarkerIcon(definition: RoleDefinition, label?: string) {
  const cacheKey = label
    ? `${definition.label}:${definition.emoji}:${definition.color}:${label}`
    : `${definition.label}:${definition.emoji}:${definition.color}`;
  const cache = label ? labeledMarkerIconCache : roleIconCache;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const pinHtml =
    `<div style="width:${MARKER_PIN_SIZE}px;height:${MARKER_PIN_SIZE}px;border-radius:50%;background:${definition.color};` +
    "border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);" +
    'display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;">' +
    `${definition.emoji}</div>`;

  const labelHtml = label
    ? `<div class="marker-label-text" style="margin-top:2px;max-width:${MARKER_LABEL_MAX_WIDTH}px;padding:1px 5px;` +
      "border-radius:4px;border:1px solid rgba(0,0,0,0.12);background:rgba(255,255,255,0.96);" +
      "box-shadow:0 1px 3px rgba(0,0,0,0.2);font-size:9px;font-weight:600;line-height:1.2;" +
      'color:#1f2937;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
      `${escapeHtml(label)}</div>`
    : "";

  const iconWidth = label ? MARKER_LABEL_MAX_WIDTH : MARKER_PIN_SIZE;
  const iconHeight = label ? MARKER_PIN_SIZE + 18 : MARKER_PIN_SIZE;

  const icon = L.divIcon({
    className: label ? "role-marker role-marker--labeled" : "role-marker",
    html:
      `<div style="display:flex;flex-direction:column;align-items:center;width:${iconWidth}px;">` +
      `${pinHtml}${labelHtml}</div>`,
    iconSize: [iconWidth, iconHeight],
    iconAnchor: [iconWidth / 2, MARKER_PIN_SIZE / 2],
    popupAnchor: [0, -MARKER_PIN_SIZE / 2],
  });

  cache.set(cacheKey, icon);
  return icon;
}

const meetingPointIcon = createMarkerIcon(MEETING_POINT_LEGEND);

function getPersonMarkerIcon(role: string, name: string) {
  return createMarkerIcon(getRoleDefinition(role), name);
}

function getMeetingPointMarkerIcon(name: string) {
  return createMarkerIcon(MEETING_POINT_LEGEND, name);
}

function getMarkerBounds(
  people: Person[],
  meetingPoints: MeetingPoint[]
): L.LatLngBounds | null {
  const allPoints = [
    ...people.map((person) => [person.lat, person.lng] as [number, number]),
    ...meetingPoints.map(
      (point) => [point.lat, point.lng] as [number, number]
    ),
  ];

  if (allPoints.length === 0) {
    return null;
  }

  return L.latLngBounds(allPoints);
}

function fitMapToContent(
  map: L.Map,
  people: Person[],
  meetingPoints: MeetingPoint[],
  selectedLocation: SelectedLocation,
  selectedMeetingLocation?: SelectedLocation
) {
  if (selectedLocation) {
    map.setView([selectedLocation.lat, selectedLocation.lng], 15, {
      animate: false,
    });
    return;
  }

  if (selectedMeetingLocation) {
    map.setView(
      [selectedMeetingLocation.lat, selectedMeetingLocation.lng],
      15,
      { animate: false }
    );
    return;
  }

  const bounds = getMarkerBounds(people, meetingPoints);

  if (bounds) {
    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 15,
      animate: false,
    });
  }
}

function waitForVisibleTiles(map: L.Map, finish: () => void, maxWaitMs: number) {
  let finished = false;

  const done = () => {
    if (finished) return;
    finished = true;
    window.setTimeout(finish, 300);
  };

  window.setTimeout(done, maxWaitMs);

  map.once("moveend", () => {
    let tileLayers = 0;
    let tilesReady = 0;

    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) return;

      tileLayers += 1;
      const tileLayer = layer as L.TileLayer & { _loading?: boolean };

      if (tileLayer._loading) {
        tileLayer.once("load", () => {
          tilesReady += 1;
          if (tilesReady >= tileLayers) {
            done();
          }
        });
      } else {
        tilesReady += 1;
      }
    });

    if (tileLayers === 0 || tilesReady >= tileLayers) {
      done();
    }
  });
}

function prepareMapInstance(
  map: L.Map,
  people: Person[],
  meetingPoints: MeetingPoint[],
  selectedLocation: SelectedLocation,
  selectedMeetingLocation: SelectedLocation | undefined,
  finish: () => void
) {
  waitForVisibleTiles(map, finish, 2500);
  map.invalidateSize({ animate: false });
  fitMapToContent(
    map,
    people,
    meetingPoints,
    selectedLocation,
    selectedMeetingLocation
  );
}

function MapController({
  people,
  meetingPoints,
  selectedLocation,
  selectedMeetingLocation,
}: {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation?: SelectedLocation;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation) {
      map.flyTo([selectedLocation.lat, selectedLocation.lng], 15);
      return;
    }

    if (selectedMeetingLocation) {
      map.flyTo(
        [selectedMeetingLocation.lat, selectedMeetingLocation.lng],
        15
      );
      return;
    }

    const bounds = getMarkerBounds(people, meetingPoints);

    if (bounds) {
      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [map, people, meetingPoints, selectedLocation, selectedMeetingLocation]);

  return null;
}

function PrintMapPreparer({
  people,
  meetingPoints,
  selectedLocation,
  selectedMeetingLocation,
}: {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation?: SelectedLocation;
}) {
  const map = useMap();

  useEffect(() => {
    function handleBeforePrint() {
      prepareMapInstance(
        map,
        people,
        meetingPoints,
        selectedLocation,
        selectedMeetingLocation,
        () => {}
      );
    }

    function handlePreparePrint(event: Event) {
      const finish = (event as CustomEvent<{ finish: () => void }>).detail
        ?.finish;
      if (!finish) return;

      prepareMapInstance(
        map,
        people,
        meetingPoints,
        selectedLocation,
        selectedMeetingLocation,
        finish
      );
    }

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener(PREPARE_MAP_PRINT_EVENT, handlePreparePrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener(PREPARE_MAP_PRINT_EVENT, handlePreparePrint);
    };
  }, [map, people, meetingPoints, selectedLocation, selectedMeetingLocation]);

  return null;
}

function LegendSwatch({
  definition,
  size = "default",
}: {
  definition: RoleDefinition;
  size?: LegendSize;
}) {
  const sizeClass =
    size === "compact"
      ? "h-4 w-4 border text-[9px]"
      : "h-6 w-6 border-2 text-xs";

  return (
    <span
      className={`map-legend-swatch inline-flex shrink-0 items-center justify-center rounded-full border-white shadow-sm ${sizeClass}`}
      style={{ backgroundColor: definition.color }}
      aria-hidden="true"
    >
      {definition.emoji}
    </span>
  );
}

function useLegendItems(people: Person[]) {
  return useMemo(() => {
    const seen = new Set<string>();
    const items: RoleDefinition[] = [];

    for (const person of people) {
      const definition = getRoleDefinition(person.role);
      const key = definition.label || "default";

      if (seen.has(key)) continue;

      seen.add(key);
      items.push(definition);
    }

    return items;
  }, [people]);
}

function MapLegend({
  people,
  meetingPoints,
  size = "default",
  placement = "overlay",
}: {
  people: Person[];
  meetingPoints: MeetingPoint[];
  size?: LegendSize;
  placement?: LegendPlacement;
}) {
  const legendItems = useLegendItems(people);
  const isCompact = size === "compact";
  const isBelow = placement === "below";

  if (legendItems.length === 0 && meetingPoints.length === 0) {
    return null;
  }

  const containerClass = isBelow
    ? "mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 print:break-inside-avoid print:bg-white"
    : isCompact
      ? "pointer-events-none absolute bottom-2 left-2 z-10 max-w-[150px] rounded-md border border-gray-200 bg-white/90 p-1.5 shadow-md backdrop-blur-sm"
      : "pointer-events-none absolute bottom-3 left-3 z-10 max-w-[220px] rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm";

  const titleClass = isCompact
    ? "mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-600"
    : "mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700";

  const itemClass = isBelow
    ? "flex items-center gap-2 text-xs text-gray-800"
    : isCompact
      ? "flex items-center gap-1.5 text-[10px] leading-tight text-gray-800"
      : "flex items-center gap-2 text-xs text-gray-800";

  const listClass = isBelow
    ? "flex flex-wrap gap-x-4 gap-y-2"
    : isCompact
      ? "space-y-1"
      : "space-y-1.5";

  return (
    <div className={containerClass}>
      <p className={titleClass}>Legend</p>
      <ul className={listClass}>
        {legendItems.map((definition) => (
          <li
            key={definition.label || "default"}
            className={itemClass}
          >
            <LegendSwatch definition={definition} size={size} />
            <span>{definition.label || "No role assigned"}</span>
          </li>
        ))}

        {meetingPoints.length > 0 && (
          <li className={itemClass}>
            <LegendSwatch definition={MEETING_POINT_LEGEND} size={size} />
            <span>{MEETING_POINT_LEGEND.label}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

function MapInteractionController({ enabled }: { enabled: boolean }) {
  const map = useMap();

  useEffect(() => {
    const handlers = [
      map.dragging,
      map.scrollWheelZoom,
      map.doubleClickZoom,
      map.touchZoom,
      map.boxZoom,
    ];

    if (enabled) {
      handlers.forEach((handler) => handler.enable());
      return;
    }

    handlers.forEach((handler) => handler.disable());
  }, [map, enabled]);

  return null;
}

function MapInteractionShield({
  active,
  onActivate,
  onDeactivate,
}: {
  active: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onDeactivate}
        className="absolute top-2 right-2 z-[1001] rounded-md border border-gray-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white print:hidden"
        aria-label="Lock map to prevent accidental dragging"
      >
        Lock map
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onActivate}
      className="absolute inset-0 z-[1001] flex cursor-default items-center justify-center bg-transparent print:hidden"
      aria-label="Enable map interaction"
    >
      <span className="pointer-events-none rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm">
        Click to move map
      </span>
    </button>
  );
}

export default function MapPicker({
  people,
  meetingPoints,
  selectedLocation,
  selectedMeetingLocation,
  large = false,
  showLegend = true,
  legendSize = "default",
  legendPlacement = "overlay",
  mapKey = "map",
  className,
  enablePrintPrepare = false,
}: MapPickerProps) {
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const heightClass =
    className ?? (large ? "h-[500px] print:h-[9.5in]" : "h-96");
  const showOverlayLegend =
    showLegend && legendPlacement === "overlay";
  const showBelowLegend =
    showLegend && legendPlacement === "below";

  return (
    <div className={legendPlacement === "below" ? "print:break-inside-avoid" : undefined}>
    <div
      className={`relative isolate z-0 overflow-hidden rounded-xl border border-gray-300 print:break-inside-avoid ${heightClass} ${
        enablePrintPrepare ? "map-print-target" : ""
      }`}
      onMouseLeave={() => setIsMapInteractive(false)}
    >
      <MapContainer
        key={mapKey}
        center={[60.1699, 24.9384]}
        zoom={11}
        dragging={isMapInteractive}
        scrollWheelZoom={isMapInteractive}
        doubleClickZoom={isMapInteractive}
        touchZoom={isMapInteractive}
        boxZoom={isMapInteractive}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          crossOrigin="anonymous"
        />

        <MapController
          people={people}
          meetingPoints={meetingPoints}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
        />

        <MapInteractionController enabled={isMapInteractive} />

        {enablePrintPrepare && (
          <PrintMapPreparer
            people={people}
            meetingPoints={meetingPoints}
            selectedLocation={selectedLocation}
            selectedMeetingLocation={selectedMeetingLocation}
          />
        )}

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>Address location found</Popup>
          </Marker>
        )}

        {selectedMeetingLocation && (
          <Marker
            position={[selectedMeetingLocation.lat, selectedMeetingLocation.lng]}
            icon={meetingPointIcon}
          >
            <Popup>New meeting point location</Popup>
          </Marker>
        )}

        {people.map((person) => {
          const roleDefinition = getRoleDefinition(person.role);

          return (
            <Marker
              key={person.id}
              position={[person.lat, person.lng]}
              icon={getPersonMarkerIcon(person.role, person.name)}
            >
              <Popup>
                <strong>
                  {roleDefinition.emoji} {person.name}
                </strong>
                {person.role && (
                  <>
                    <br />
                    {person.role}
                  </>
                )}
                {person.phone && (
                  <>
                    <br />
                    {person.phone}
                  </>
                )}
                <br />
                {formatCompactAddress(person.address)}
              </Popup>
            </Marker>
          );
        })}

        {meetingPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={getMeetingPointMarkerIcon(point.name)}
          >
            <Popup>
              <strong>🚩 {point.name}</strong>
              <br />
              {formatCompactAddress(point.address)}
              {point.notes && (
                <>
                  <br />
                  {point.notes}
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <MapInteractionShield
        active={isMapInteractive}
        onActivate={() => setIsMapInteractive(true)}
        onDeactivate={() => setIsMapInteractive(false)}
      />

      {showOverlayLegend && (
        <MapLegend
          people={people}
          meetingPoints={meetingPoints}
          size={legendSize}
          placement="overlay"
        />
      )}
    </div>

    {showBelowLegend && (
      <MapLegend
        people={people}
        meetingPoints={meetingPoints}
        size={legendSize}
        placement="below"
      />
    )}
    </div>
  );
}
