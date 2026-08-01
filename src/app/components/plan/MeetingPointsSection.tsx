"use client";

import MeetingPointCard from "@/app/components/plan/MeetingPointCard";
import type { GeocodeResult, MeetingPoint, SelectedLocation } from "@/app/types";

type MeetingPointsSectionProps = {
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
    <div id="meeting-points" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-gray-100 pb-4">
        <p className="text-xs text-gray-500">
          Rally points people should go to in an emergency. Type an address, or
          use Drop pin on the map. Add custom paths under the Routes tab.
        </p>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Name
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            type="text"
            placeholder="Main office rally point"
            value={meetingPointName}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Address
          </label>
          <input
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            type="text"
            placeholder="Street, city, country"
            value={meetingPointAddress}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Notes (optional)
          </label>
          <textarea
            className="min-h-16 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder="Wait at the main entrance"
            value={meetingPointNotes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        {isSearchingMeeting && (
          <p className="text-xs text-gray-500">Searching address…</p>
        )}

        {!isSearchingMeeting &&
          meetingSearchMessage &&
          !pendingMeetingGeocode &&
          !selectedMeetingLocation && (
            <p className="text-xs text-amber-700">{meetingSearchMessage}</p>
          )}

        {pendingMeetingGeocode && !selectedMeetingLocation && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                Confirm address
              </p>
              <p className="mt-0.5 text-sm text-amber-900">
                {pendingMeetingGeocode.compactAddress}
              </p>
            </div>
            <button
              type="button"
              onClick={onConfirmAddress}
              className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Use this
            </button>
          </div>
        )}

        {selectedMeetingLocation && (
          <p className="text-xs font-medium text-green-700">
            ✓ {pendingMeetingGeocode?.compactAddress || meetingPointAddress}
          </p>
        )}

        <button
          type="button"
          onClick={onAddMeetingPoint}
          className="w-full rounded-md bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          Add meeting point
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-4">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Saved points
          </h3>
          {meetingPoints.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
          {meetingPoints.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
              No meeting points yet
            </p>
          ) : (
            <div className="grid gap-2">
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
      </div>
    </div>
  );
}
