"use client";

import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import type { MeetingPoint, Person, SelectedLocation } from "@/app/types";

type MapPickerProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation?: SelectedLocation;
  large?: boolean;
};

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const meetingPointIcon = L.divIcon({
  className: "meeting-point-marker",
  html:
    '<div style="width:18px;height:18px;border-radius:50%;background:#dc2626;' +
    'border:3px solid white;box-shadow:0 0 0 1px rgba(0,0,0,0.3);"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

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

    const allPoints = [
      ...people.map((person) => [person.lat, person.lng] as [number, number]),
      ...meetingPoints.map(
        (point) => [point.lat, point.lng] as [number, number]
      ),
    ];

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);

      map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 15,
      });
    }
  }, [map, people, meetingPoints, selectedLocation, selectedMeetingLocation]);

  useEffect(() => {
    function handleBeforePrint() {
      map.invalidateSize();
    }

    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [map]);

  return null;
}

export default function MapPicker({
  people,
  meetingPoints,
  selectedLocation,
  selectedMeetingLocation,
  large = false,
}: MapPickerProps) {
  return (
    <div
      className={`${
        large ? "h-[500px] print:h-[420px]" : "h-96"
      } overflow-hidden rounded-xl border border-gray-300 print:break-inside-avoid`}
    >
      <MapContainer
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

        {people.map((person) => (
          <Marker key={person.id} position={[person.lat, person.lng]}>
            <Popup>
              <strong>{person.name}</strong>
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
        ))}

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
    </div>
  );
}
