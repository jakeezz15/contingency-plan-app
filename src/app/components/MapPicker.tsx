"use client";

import L from "leaflet";
import { useEffect, useMemo } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  getRoleDefinition,
  MEETING_POINT_LEGEND,
  type RoleDefinition,
} from "@/app/lib/roles";
import type { MeetingPoint, Person, SelectedLocation } from "@/app/types";
import { PREPARE_MAP_PRINT_EVENT } from "@/app/lib/mapPrint";

type MapPickerProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation?: SelectedLocation;
  large?: boolean;
  showLegend?: boolean;
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

function createMarkerIcon(definition: RoleDefinition) {
  const cacheKey = `${definition.label}:${definition.emoji}:${definition.color}`;

  if (roleIconCache.has(cacheKey)) {
    return roleIconCache.get(cacheKey)!;
  }

  const icon = L.divIcon({
    className: "role-marker",
    html:
      `<div style="width:32px;height:32px;border-radius:50%;background:${definition.color};` +
      "border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);" +
      'display:flex;align-items:center;justify-content:center;font-size:15px;line-height:1;">' +
      `${definition.emoji}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  roleIconCache.set(cacheKey, icon);
  return icon;
}

const meetingPointIcon = createMarkerIcon(MEETING_POINT_LEGEND);

function getPersonMarkerIcon(role: string) {
  return createMarkerIcon(getRoleDefinition(role));
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

function LegendSwatch({ definition }: { definition: RoleDefinition }) {
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-white text-xs shadow-sm"
      style={{ backgroundColor: definition.color }}
      aria-hidden="true"
    >
      {definition.emoji}
    </span>
  );
}

function MapLegend({
  people,
  meetingPoints,
}: {
  people: Person[];
  meetingPoints: MeetingPoint[];
}) {
  const legendItems = useMemo(() => {
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

  if (legendItems.length === 0 && meetingPoints.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 max-w-[220px] rounded-lg border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm print:bg-white">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-700">
        Legend
      </p>
      <ul className="space-y-1.5">
        {legendItems.map((definition) => (
          <li
            key={definition.label || "default"}
            className="flex items-center gap-2 text-xs text-gray-800"
          >
            <LegendSwatch definition={definition} />
            <span>{definition.label || "No role assigned"}</span>
          </li>
        ))}

        {meetingPoints.length > 0 && (
          <li className="flex items-center gap-2 text-xs text-gray-800">
            <LegendSwatch definition={MEETING_POINT_LEGEND} />
            <span>{MEETING_POINT_LEGEND.label}</span>
          </li>
        )}
      </ul>
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
  mapKey = "map",
  className,
  enablePrintPrepare = false,
}: MapPickerProps) {
  const heightClass =
    className ?? (large ? "h-[500px] print:h-[9.5in]" : "h-96");

  return (
    <div
      className={`relative isolate z-0 overflow-hidden rounded-xl border border-gray-300 print:break-inside-avoid ${heightClass} ${
        enablePrintPrepare ? "map-print-target" : ""
      }`}
    >
      <MapContainer
        key={mapKey}
        center={[60.1699, 24.9384]}
        zoom={11}
        scrollWheelZoom={true}
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
              icon={getPersonMarkerIcon(person.role)}
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
                {person.address}
              </Popup>
            </Marker>
          );
        })}

        {meetingPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={meetingPointIcon}
          >
            <Popup>
              <strong>🚩 {point.name}</strong>
              <br />
              {point.address}
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

      {showLegend && (
        <MapLegend people={people} meetingPoints={meetingPoints} />
      )}
    </div>
  );
}
