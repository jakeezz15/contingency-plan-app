"use client";

import KeyPeopleFields from "@/app/components/KeyPeopleFields";
import ColorSwatches from "@/app/components/ColorSwatches";
import PersonCard from "@/app/components/PersonCard";
import {
  DEFAULT_PERSON_COLOR,
  normalizePlanColor,
} from "@/app/lib/colors";
import {
  buildHouseholdMembers,
  type KeyPersonDraft,
} from "@/app/lib/roles";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
  SelectedLocation,
} from "@/app/types";

type PeopleSectionProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  editingPersonId: number | null;
  generatePlanHint: string;
  canGeneratePlan: boolean;
  label: string;
  labelColor: string;
  keyPeople: KeyPersonDraft[];
  namesText: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  onLabelChange: (value: string) => void;
  onLabelColorChange: (value: string) => void;
  onKeyPeopleChange: (value: KeyPersonDraft[]) => void;
  onNamesTextChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onConfirmAddress: () => void;
  onAddHousehold: () => void;
  onClearAll: () => void;
  onEditPerson: (id: number) => void;
  onCancelEditPerson: () => void;
  onRemovePerson: (id: number) => void;
};

export default function PeopleSection({
  people,
  meetingPoints,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  label,
  labelColor,
  keyPeople,
  namesText,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  onLabelChange,
  onLabelColorChange,
  onKeyPeopleChange,
  onNamesTextChange,
  onAddressChange,
  onConfirmAddress,
  onAddHousehold,
  onClearAll,
  onEditPerson,
  onCancelEditPerson,
  onRemovePerson,
}: PeopleSectionProps) {
  const isEditing = editingPersonId !== null;
  const memberCount = buildHouseholdMembers(keyPeople, namesText).length;
  const canSubmit =
    Boolean(selectedLocation) && Boolean(label.trim()) && memberCount > 0;
  const pinColor = normalizePlanColor(labelColor, DEFAULT_PERSON_COLOR);

  return (
    <div id="people" className="flex min-h-0 flex-1 flex-col">
      <div
        id="people-form"
        className="shrink-0 space-y-4 border-b border-gray-100 pb-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-gray-500">
            {isEditing
              ? "Editing pin — same form as create. Save when done."
              : "One label = one pin. Type an address, or use Drop pin on the map. Pick a color to tell pins apart."}
          </p>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEditPerson}
              className="shrink-0 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="sm:w-20">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Label
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: pinColor }}
                aria-hidden="true"
              >
                {(label.trim() || "•").slice(0, 4)}
              </span>
              <input
                className="w-full rounded-md border border-gray-300 py-2 pr-2 pl-9 text-center text-sm font-semibold text-gray-900"
                type="text"
                placeholder="1"
                value={label}
                onChange={(e) => onLabelChange(e.target.value)}
                maxLength={4}
                aria-label="Map label"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Address
            </label>
            <input
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              type="text"
              placeholder="Street, city, country"
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            Pin color
          </label>
          <ColorSwatches
            value={pinColor}
            onChange={onLabelColorChange}
            name="person-label-color"
            label="Pin color"
          />
        </div>

        {isSearching && (
          <p className="text-xs text-gray-500">Searching address…</p>
        )}

        {!isSearching &&
          searchMessage &&
          !pendingGeocode &&
          !selectedLocation && (
            <p className="text-xs text-amber-700">{searchMessage}</p>
          )}

        {pendingGeocode && !selectedLocation && (
          <div className="flex flex-col gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                Confirm address
              </p>
              <p className="mt-0.5 text-sm text-amber-900">
                {pendingGeocode.compactAddress}
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

        {selectedLocation && (
          <p className="text-xs font-medium text-green-700">
            ✓ {pendingGeocode?.compactAddress || address}
          </p>
        )}

        <KeyPeopleFields keyPeople={keyPeople} onChange={onKeyPeopleChange} />

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Names of other people
          </label>
          <textarea
            className="min-h-20 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder={"John\nJohnny\nJane"}
            value={namesText}
            onChange={(e) => onNamesTextChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Regular people at this pin — one name per line
          </p>
        </div>

        <button
          type="button"
          onClick={onAddHousehold}
          disabled={!canSubmit}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isEditing
            ? `Save pin ${label.trim() || "—"}`
            : memberCount > 1
              ? `Add pin ${label.trim() || "—"} (${memberCount} people)`
              : `Add pin ${label.trim() || "—"}`}
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-4">
        <div className="mb-2 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
            Saved pins
          </h3>
          {people.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>

        {!canGeneratePlan && generatePlanHint && (
          <p className="mb-3 shrink-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {generatePlanHint}
          </p>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-4">
          {people.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-300 px-3 py-6 text-center text-xs text-gray-500">
              No pins yet
            </p>
          ) : (
            <div className="grid gap-2">
              {people.map((person) => (
                <PersonCard
                  key={person.id}
                  person={person}
                  meetingPoints={meetingPoints}
                  isEditing={editingPersonId === person.id}
                  onEdit={() => onEditPerson(person.id)}
                  onRemove={() => onRemovePerson(person.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
