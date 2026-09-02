"use client";

import L from "leaflet";
import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { formatCompactAddress } from "@/app/lib/address";
import {
  BASEMAP_OPTIONS,
  DEFAULT_BASEMAP,
  type BasemapId,
} from "@/app/lib/basemaps";
import {
  groupPeopleByLocation,
  spreadOverlappingMarkers,
} from "@/app/lib/markerLayout";
import {
  MEETING_POINT_LEGEND,
  PERSON_MARKER,
  type MarkerStyle,
} from "@/app/lib/roles";
import { DEFAULT_PERSON_COLOR, normalizePlanColor } from "@/app/lib/colors";
import {
  getPlannedRoutePaths,
  type RoutePath,
} from "@/app/lib/routing";
import type {
  MeetingPoint,
  Person,
  PlannedRoute,
  SelectedLocation,
} from "@/app/types";
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
  /** Edge-to-edge map with no rounded frame (workspace layout). */
  flush?: boolean;
  enablePrintPrepare?: boolean;
  basemap?: BasemapId;
  onBasemapChange?: (basemap: BasemapId) => void;
  showBasemapSwitcher?: boolean;
  /** When set, users can drop a pin by clicking the map. */
  onMapPin?: (lat: number, lng: number) => void;
  pinTargetLabel?: string;
  /** User-defined routes to draw on the map. */
  plannedRoutes?: PlannedRoute[];
  /** Draw planned driving routes when available. */
  showRoutes?: boolean;
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerIconCache = new Map<string, L.DivIcon>();

const MARKER_PIN_SIZE = 32;

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pinFontSize(pinText: string) {
  if (pinText.length <= 2) return 14;
  if (pinText.length <= 3) return 12;
  return 10;
}

function createMarkerIcon(color: string, pinText: string) {
  const displayText = pinText.trim() || "•";
  const cacheKey = `${color}:${displayText}`;

  if (markerIconCache.has(cacheKey)) {
    return markerIconCache.get(cacheKey)!;
  }

  const pinHtml =
    `<div style="width:${MARKER_PIN_SIZE}px;height:${MARKER_PIN_SIZE}px;border-radius:50%;background:${color};` +
    "border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);" +
    `display:flex;align-items:center;justify-content:center;font-size:${pinFontSize(displayText)}px;` +
    'font-weight:700;line-height:1;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">' +
    `${escapeHtml(displayText)}</div>`;

  const icon = L.divIcon({
    className: "role-marker",
    html: `<div style="display:flex;align-items:center;justify-content:center;width:${MARKER_PIN_SIZE}px;">${pinHtml}</div>`,
    iconSize: [MARKER_PIN_SIZE, MARKER_PIN_SIZE],
    iconAnchor: [MARKER_PIN_SIZE / 2, MARKER_PIN_SIZE / 2],
    popupAnchor: [0, -MARKER_PIN_SIZE / 2],
  });

  markerIconCache.set(cacheKey, icon);
  return icon;
}

const meetingPointIcon = createMarkerIcon(MEETING_POINT_LEGEND.color, "M");

function getPersonMarkerIcon(label: string, color: string) {
  return createMarkerIcon(color, label);
}

function getMeetingPointMarkerIcon() {
  return createMarkerIcon(MEETING_POINT_LEGEND.color, "M");
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
    window.setTimeout(finish, 500);
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
  waitForVisibleTiles(map, finish, 4500);
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
  style,
  size = "default",
}: {
  style: MarkerStyle;
  size?: LegendSize;
}) {
  const sizeClass =
    size === "compact"
      ? "h-4 w-4 border text-[9px]"
      : "h-6 w-6 border-2 text-xs";

  return (
    <span
      className={`map-legend-swatch inline-flex shrink-0 items-center justify-center rounded-full border-white font-bold text-white shadow-sm ${sizeClass}`}
      style={{ backgroundColor: style.color }}
      aria-hidden="true"
    >
      {style.label === PERSON_MARKER.label ? "#" : "M"}
    </span>
  );
}

function MapLegend({
  people,
  meetingPoints,
  routeLegend,
  size = "default",
  placement = "overlay",
}: {
  people: Person[];
  meetingPoints: MeetingPoint[];
  routeLegend: { id: string; label: string; color: string }[];
  size?: LegendSize;
  placement?: LegendPlacement;
}) {
  const isCompact = size === "compact";
  const isBelow = placement === "below";

  if (
    people.length === 0 &&
    meetingPoints.length === 0 &&
    routeLegend.length === 0
  ) {
    return null;
  }

  const containerClass = isBelow
    ? "mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 print:break-inside-avoid print:bg-white"
    : isCompact
      ? "pointer-events-none absolute bottom-2 left-2 z-10 max-w-[170px] rounded-md border border-gray-200 bg-white/90 p-1.5 shadow-md backdrop-blur-sm"
      : "pointer-events-none absolute bottom-3 left-3 z-10 max-w-[240px] rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm";

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
        {people.length > 0 && (
          <>
            {people.map((person) => (
              <li key={person.id} className={itemClass}>
                <span
                  className={`inline-flex shrink-0 items-center justify-center rounded-full border border-white font-bold text-white shadow-sm ${
                    isCompact
                      ? "h-4 w-4 text-[9px]"
                      : "h-5 w-5 text-[10px]"
                  }`}
                  style={{
                    backgroundColor: normalizePlanColor(
                      person.color,
                      DEFAULT_PERSON_COLOR
                    ),
                  }}
                  aria-hidden="true"
                >
                  {(person.label || "•").slice(0, 2)}
                </span>
                <span className="min-w-0 truncate">
                  Pin {person.label || "—"}
                </span>
              </li>
            ))}
          </>
        )}

        {meetingPoints.length > 0 && (
          <li className={itemClass}>
            <LegendSwatch style={MEETING_POINT_LEGEND} size={size} />
            <span>{MEETING_POINT_LEGEND.label}</span>
          </li>
        )}

        {routeLegend.map((route) => (
          <li key={route.id} className={itemClass}>
            <span
              className={`inline-block shrink-0 rounded-full ${
                isCompact ? "h-0.5 w-4" : "h-1 w-5"
              }`}
              style={{ backgroundColor: route.color }}
              aria-hidden="true"
            />
            <span className="min-w-0 truncate">{route.label}</span>
          </li>
        ))}
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

function MapClickPinHandler({
  enabled,
  onPin,
}: {
  enabled: boolean;
  onPin: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(event) {
      if (!enabled) return;
      onPin(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function MapInteractionShield({
  active,
  pinDropMode,
  onActivate,
  onDeactivate,
  onStartPinDrop,
  onCancelPinDrop,
  pinTargetLabel,
}: {
  active: boolean;
  pinDropMode: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onStartPinDrop?: () => void;
  onCancelPinDrop?: () => void;
  pinTargetLabel?: string;
}) {
  if (pinDropMode) {
    return (
      <div className="map-interaction-ui absolute top-2 right-2 z-[1001] flex flex-col items-end gap-2 print:hidden">
        <p className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 shadow-sm">
          Click the map to drop a pin
          {pinTargetLabel ? ` for ${pinTargetLabel}` : ""}
        </p>
        <button
          type="button"
          onClick={onCancelPinDrop}
          className="rounded-md border border-gray-300 bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white"
        >
          Cancel pin
        </button>
      </div>
    );
  }

  if (active) {
    return (
      <div className="map-interaction-ui absolute top-2 right-2 z-[1001] flex flex-wrap justify-end gap-2 print:hidden">
        {onStartPinDrop && (
          <button
            type="button"
            onClick={onStartPinDrop}
            className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 shadow-sm hover:bg-blue-100"
          >
            Drop pin
          </button>
        )}
        <button
          type="button"
          onClick={onDeactivate}
          className="rounded-md border border-gray-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-white"
          aria-label="Lock map to prevent accidental dragging"
        >
          Lock map
        </button>
      </div>
    );
  }

  return (
    <div className="map-interaction-ui absolute inset-0 z-[1001] print:hidden">
      <button
        type="button"
        onClick={onActivate}
        className="absolute inset-0 flex cursor-default items-center justify-center bg-transparent"
        aria-label="Enable map interaction"
      >
        <span className="pointer-events-none rounded-lg border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm backdrop-blur-sm">
          Click to move map
        </span>
      </button>
      {onStartPinDrop && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onStartPinDrop();
          }}
          className="absolute top-2 right-2 rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-800 shadow-sm hover:bg-blue-100"
        >
          Drop pin
        </button>
      )}
    </div>
  );
}

function BasemapSwitcher({
  value,
  onChange,
  compact = false,
}: {
  value: BasemapId;
  onChange: (basemap: BasemapId) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`map-basemap-switcher flex flex-wrap gap-1 ${
        compact ? "mb-0" : "mb-3"
      }`}
      role="group"
      aria-label="Map style"
    >
      {BASEMAP_OPTIONS.map((option) => {
        const isActive = option.id === value;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition ${
              isActive
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
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
  flush = false,
  enablePrintPrepare = false,
  basemap: basemapProp,
  onBasemapChange,
  showBasemapSwitcher = true,
  onMapPin,
  pinTargetLabel,
  plannedRoutes = [],
  showRoutes = true,
}: MapPickerProps) {
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const [pinDropMode, setPinDropMode] = useState(false);
  const [routes, setRoutes] = useState<RoutePath[]>([]);
  const [internalBasemap, setInternalBasemap] =
    useState<BasemapId>(DEFAULT_BASEMAP);
  const basemap = basemapProp ?? internalBasemap;
  const mapControlsEnabled = isMapInteractive || pinDropMode;

  function handleBasemapChange(next: BasemapId) {
    if (onBasemapChange) {
      onBasemapChange(next);
      return;
    }
    setInternalBasemap(next);
  }

  function startPinDrop() {
    setIsMapInteractive(true);
    setPinDropMode(true);
  }

  function cancelPinDrop() {
    setPinDropMode(false);
  }

  function handleMapPin(lat: number, lng: number) {
    if (!onMapPin) return;
    onMapPin(lat, lng);
    setPinDropMode(false);
  }

  useEffect(() => {
    if (!showRoutes || plannedRoutes.length === 0) {
      setRoutes([]);
      return;
    }

    let cancelled = false;

    getPlannedRoutePaths(plannedRoutes, people, meetingPoints).then((next) => {
      if (!cancelled) setRoutes(next);
    });

    return () => {
      cancelled = true;
    };
  }, [people, meetingPoints, plannedRoutes, showRoutes]);

  const positionedMarkers = useMemo(() => {
    const personGroups = groupPeopleByLocation(people).map((group) => ({
      ...group,
      kind: "personGroup" as const,
    }));

    return spreadOverlappingMarkers([
      ...personGroups,
      ...meetingPoints.map((point) => ({
        ...point,
        kind: "meetingPoint" as const,
      })),
    ]);
  }, [people, meetingPoints]);
  const heightClass =
    className ?? (large ? "h-[500px] print:h-[9.5in]" : "h-96");
  const showOverlayLegend =
    showLegend && legendPlacement === "overlay";
  const showBelowLegend =
    showLegend && legendPlacement === "below";
  const routeLegend = routes.map((route) => ({
    id: route.id,
    label: `${route.fromLabel} → ${route.toLabel}`,
    color: route.color,
  }));

  return (
    <div
      className={
        flush
          ? `flex h-full min-h-0 w-full flex-col ${
              legendPlacement === "below" ? "print:break-inside-avoid" : ""
            }`
          : legendPlacement === "below"
            ? "print:break-inside-avoid"
            : undefined
      }
    >
    {showBasemapSwitcher && !flush && (
      <BasemapSwitcher
        value={basemap}
        onChange={handleBasemapChange}
        compact={legendSize === "compact"}
      />
    )}
    <div
      className={`relative isolate z-0 min-h-0 flex-1 overflow-hidden print:break-inside-avoid ${
        flush ? "rounded-none border-0" : "rounded-xl border border-gray-300"
      } ${heightClass} ${enablePrintPrepare ? "map-print-target" : ""} ${
        showBasemapSwitcher && flush ? "map-with-basemap-overlay" : ""
      }`}
      onMouseLeave={() => setIsMapInteractive(false)}
    >
      {showBasemapSwitcher && flush && (
        <div className="absolute top-2 left-2 z-[1001] max-w-[calc(100%-6rem)] rounded-md bg-white/95 p-1 shadow-sm backdrop-blur-sm print:hidden">
          <BasemapSwitcher
            value={basemap}
            onChange={handleBasemapChange}
            compact
          />
        </div>
      )}
      <MapContainer
        key={mapKey}
        center={[60.1699, 24.9384]}
        zoom={11}
        dragging={mapControlsEnabled}
        scrollWheelZoom={mapControlsEnabled}
        doubleClickZoom={mapControlsEnabled}
        touchZoom={mapControlsEnabled}
        boxZoom={mapControlsEnabled}
        className="h-full w-full"
      >
        {basemap === "streets" && (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
            maxZoom={19}
          />
        )}

        {basemap === "satellite" && (
          <TileLayer
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            crossOrigin="anonymous"
            maxZoom={19}
          />
        )}

        {basemap === "hybrid" && (
          <>
            <TileLayer
              attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              crossOrigin="anonymous"
              maxZoom={19}
            />
            <TileLayer
              attribution="Labels &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              crossOrigin="anonymous"
              maxZoom={19}
              opacity={0.95}
            />
          </>
        )}

        {basemap === "topo" && (
          <TileLayer
            attribution="Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)"
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            crossOrigin="anonymous"
            maxZoom={17}
          />
        )}

        {basemap === "light" && (
          <TileLayer
            attribution="&copy; OpenStreetMap contributors &copy; CARTO"
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
            subdomains="abcd"
            crossOrigin="anonymous"
            maxZoom={20}
          />
        )}

        <MapController
          people={people}
          meetingPoints={meetingPoints}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
        />

        <MapInteractionController enabled={mapControlsEnabled} />

        {onMapPin && (
          <MapClickPinHandler enabled={pinDropMode} onPin={handleMapPin} />
        )}

        {enablePrintPrepare && (
          <PrintMapPreparer
            people={people}
            meetingPoints={meetingPoints}
            selectedLocation={selectedLocation}
            selectedMeetingLocation={selectedMeetingLocation}
          />
        )}

        {routes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.coordinates.map((point) => [
              point.lat,
              point.lng,
            ])}
            pathOptions={{
              color: route.color,
              weight: 4,
              opacity: 0.8,
              dashArray: route.isFallback ? "8 8" : undefined,
              lineJoin: "round",
              lineCap: "round",
            }}
          >
            <Popup>
              {route.fromLabel} → {route.toLabel}
              {route.isFallback ? " (approx.)" : ""}
            </Popup>
          </Polyline>
        ))}

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>Pinned / confirmed location</Popup>
          </Marker>
        )}

        {selectedMeetingLocation && (
          <Marker
            position={[selectedMeetingLocation.lat, selectedMeetingLocation.lng]}
            icon={meetingPointIcon}
          >
            <Popup>Pinned / confirmed meeting point</Popup>
          </Marker>
        )}

        {positionedMarkers.map((entry) => {
          if (entry.kind === "personGroup") {
            const group = entry;

            return (
              <Marker
                key={`person-group-${group.id}`}
                position={[group.displayLat, group.displayLng]}
                icon={getPersonMarkerIcon(group.pinLabel, group.pinColor)}
              >
                <Popup>
                  <div style={{ minWidth: 140 }}>
                    <div style={{ marginBottom: 4 }}>
                      <strong>Label {group.pinLabel}</strong>
                    </div>
                    <div style={{ marginBottom: 4, color: "#4b5563" }}>
                      {formatCompactAddress(group.address)}
                    </div>
                    {group.households.flatMap((household) =>
                      household.members.map((member, memberIndex) => {
                        const status = member.status?.trim() ?? "";

                        return (
                          <div
                            key={`${household.id}-${memberIndex}`}
                            style={{
                              marginTop: 6,
                              paddingTop: 6,
                              borderTop: "1px solid #e5e7eb",
                            }}
                          >
                            <strong>{member.name}</strong>
                            {status ? (
                              <>
                                {" "}
                                (
                                <span style={{ fontWeight: 700, fontStyle: "italic" }}>
                                  {status}
                                </span>
                                )
                              </>
                            ) : null}
                            {member.phone && (
                              <>
                                <br />
                                {member.phone}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          }

          const point = entry;

          return (
            <Marker
              key={`meeting-point-${point.id}`}
              position={[point.displayLat, point.displayLng]}
              icon={getMeetingPointMarkerIcon()}
            >
              <Popup>
                <strong>{point.name}</strong>
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
          );
        })}
      </MapContainer>

      <MapInteractionShield
        active={isMapInteractive}
        pinDropMode={pinDropMode}
        onActivate={() => setIsMapInteractive(true)}
        onDeactivate={() => {
          setIsMapInteractive(false);
          setPinDropMode(false);
        }}
        onStartPinDrop={onMapPin ? startPinDrop : undefined}
        onCancelPinDrop={cancelPinDrop}
        pinTargetLabel={pinTargetLabel}
      />

      {showOverlayLegend && (
        <MapLegend
          people={people}
          meetingPoints={meetingPoints}
          routeLegend={routeLegend}
          size={legendSize}
          placement="overlay"
        />
      )}
    </div>

    {showBelowLegend && (
      <MapLegend
        people={people}
        meetingPoints={meetingPoints}
        routeLegend={routeLegend}
        size={legendSize}
        placement="below"
      />
    )}
    </div>
  );
}
