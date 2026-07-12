"use client";

import dynamic from "next/dynamic";
import ClientOnly from "@/app/components/ClientOnly";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import type { MeetingPoint, Person, SelectedLocation } from "@/app/types";

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

const MAP_HEIGHT_CLASS = "h-64 sm:h-80 lg:h-[calc(100vh-12rem)] lg:min-h-96";

type MapPreviewPanelProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  selectedLocation: SelectedLocation;
  selectedMeetingLocation: SelectedLocation;
};

export default function MapPreviewPanel({
  people,
  meetingPoints,
  selectedLocation,
  selectedMeetingLocation,
}: MapPreviewPanelProps) {
  return (
    <aside>
      <section
        id="map-preview"
        className="scroll-mt-44 rounded-xl bg-white p-4 shadow sm:p-6"
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-900">Map Preview</h2>

        <ClientOnly fallback={<MapPlaceholder className={MAP_HEIGHT_CLASS} />}>
          <MapPicker
            mapKey="editor-map"
            people={people}
            meetingPoints={meetingPoints}
            selectedLocation={selectedLocation}
            selectedMeetingLocation={selectedMeetingLocation}
            legendSize="compact"
            className={MAP_HEIGHT_CLASS}
          />
        </ClientOnly>
      </section>
    </aside>
  );
}
