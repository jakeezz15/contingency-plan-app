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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900">Map Preview</h2>

          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-blue-600" />
              Person
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-full bg-red-600" />
              Meeting point
            </span>
          </div>
        </div>

        <ClientOnly fallback={<MapPlaceholder className={MAP_HEIGHT_CLASS} />}>
          <MapPicker
            mapKey="editor-map"
            people={people}
            meetingPoints={meetingPoints}
            selectedLocation={selectedLocation}
            selectedMeetingLocation={selectedMeetingLocation}
            className={MAP_HEIGHT_CLASS}
          />
        </ClientOnly>
      </section>
    </aside>
  );
}
