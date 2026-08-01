"use client";

import dynamic from "next/dynamic";
import ClientOnly from "@/app/components/ClientOnly";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import type { BasemapId } from "@/app/lib/basemaps";
import type {
  MeetingPoint,
  Person,
  PlannedRoute,
  SelectedLocation,
} from "@/app/types";

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

type MapPreviewPanelProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  plannedRoutes?: PlannedRoute[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation: SelectedLocation;
  basemap: BasemapId;
  onBasemapChange: (basemap: BasemapId) => void;
  pinTarget: "person" | "meeting";
  onMapPin?: (lat: number, lng: number) => void;
};

export default function MapPreviewPanel({
  people,
  meetingPoints,
  plannedRoutes = [],
  selectedLocation,
  selectedMeetingLocation,
  basemap,
  onBasemapChange,
  pinTarget,
  onMapPin,
}: MapPreviewPanelProps) {
  return (
    <section id="map-preview" className="relative h-full min-h-0 w-full">
      <ClientOnly
        fallback={
          <MapPlaceholder className="h-full min-h-0 w-full rounded-none border-0" />
        }
      >
        <MapPicker
          mapKey="editor-map"
          people={people}
          meetingPoints={meetingPoints}
          plannedRoutes={plannedRoutes}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
          legendSize="compact"
          flush
          className="h-full min-h-0 w-full"
          basemap={basemap}
          onBasemapChange={onBasemapChange}
          onMapPin={onMapPin}
          pinTargetLabel={pinTarget === "person" ? "people" : "meeting point"}
        />
      </ClientOnly>
    </section>
  );
}
