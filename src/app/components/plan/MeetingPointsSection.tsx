"use client";

import CollapsibleSection from "@/app/components/CollapsibleSection";
import MeetingPointCard from "@/app/components/plan/MeetingPointCard";
import type { GeocodeResult, MeetingPoint, SelectedLocation } from "@/app/types";

type MeetingPointsSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  meetingPoints: MeetingPoint[];
  meetingPointName: string;
  meetingPointAddress: string;
  meetingPointNotes: string;
  meetingSearchMessage: string;
  isSearchingMeeting: boolean;
  pendingMeetingGeocode: GeocodeResult | null;
  selectedMeetingLocation: SelectedLocation;
  onNameChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onConfirmAddress: () => void;
  onAddMeetingPoint: () => void;
  onClearAll: () => void;
  onRemoveMeetingPoint: (id: number) => void;
};

export default function MeetingPointsSection({
  isOpen,
  onToggle,
  meetingPoints,
  meetingPointName,
  meetingPointAddress,
  meetingPointNotes,
  meetingSearchMessage,
  isSearchingMeeting,
  pendingMeetingGeocode,
  selectedMeetingLocation,
  onNameChange,
  onAddressChange,
  onNotesChange,
  onConfirmAddress,
  onAddMeetingPoint,
  onClearAll,
  onRemoveMeetingPoint,
}: MeetingPointsSectionProps) {
  return (
    <CollapsibleSection
      id="meeting-points"
      title="Meeting Points"
      description="Rally points people should go to in an emergency."
      badge={
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          {meetingPoints.length}
        </span>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Add Meeting Point
        </h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="text"
            placeholder="Example: Main Office Rally Point"
            value={meetingPointName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="text"
            placeholder="Example: Mannerheimintie 1, Helsinki, Finland"
            value={meetingPointAddress}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            className="min-h-16 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            placeholder="Example: Wait at the main entrance."
            value={meetingPointNotes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        {meetingSearchMessage && (
          <div className="mb-4 rounded-lg bg-white p-3 text-sm text-gray-700">
            {isSearchingMeeting ? "🔎 " : "📍 "}
            {meetingSearchMessage}
          </div>
        )}

        {pendingMeetingGeocode && !selectedMeetingLocation && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Did you mean this address?</p>
            <p className="mt-1">{pendingMeetingGeocode.displayName}</p>
            <button
              type="button"
              onClick={onConfirmAddress}
              className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Use This Address
            </button>
          </div>
        )}

        {selectedMeetingLocation && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Address confirmed.
            <br />
            Lat: {selectedMeetingLocation.lat.toFixed(5)}
            <br />
            Lng: {selectedMeetingLocation.lng.toFixed(5)}
          </div>
        )}

        <button
          type="button"
          onClick={onAddMeetingPoint}
          className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
        >
          Add Meeting Point Marker
        </button>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Saved Meeting Points
          </h3>

          {meetingPoints.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>

        {meetingPoints.length === 0 ? (
          <p className="text-gray-500">No meeting points added yet.</p>
        ) : (
          <div className="grid gap-3">
            {meetingPoints.map((point) => (
              <MeetingPointCard
                key={point.id}
                point={point}
                onRemove={() => onRemoveMeetingPoint(point.id)}
              />
            ))}
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
