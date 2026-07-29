"use client";

import PersonCard from "@/app/components/PersonCard";
import { parseNamesText, PERSON_MARKER } from "@/app/lib/roles";
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
  namesText: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  onLabelChange: (value: string) => void;
  onNamesTextChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onConfirmAddress: () => void;
  onAddHousehold: () => void;
  onClearAll: () => void;
  onEditPerson: (id: number) => void;
  onCancelEditPerson: () => void;
  onSavePerson: (person: Person) => void;
  onRemovePerson: (id: number) => void;
};

export default function PeopleSection({
  people,
  meetingPoints,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  label,
  namesText,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  onLabelChange,
  onNamesTextChange,
  onAddressChange,
  onConfirmAddress,
  onAddHousehold,
  onClearAll,
  onEditPerson,
  onCancelEditPerson,
  onSavePerson,
  onRemovePerson,
}: PeopleSectionProps) {
  const filledNames = parseNamesText(namesText).length;
  const canSubmit =
    Boolean(selectedLocation) && Boolean(label.trim()) && filledNames > 0;

  return (
    <div id="people" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-gray-100 pb-4">
        <p className="text-xs text-gray-500">
          One label = one pin. List everyone at that address below.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="sm:w-20">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Label
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute top-1/2 left-2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: PERSON_MARKER.color }}
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

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Names
          </label>
          <textarea
            className="min-h-24 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder={"John\nJohnny\nJane"}
            value={namesText}
            onChange={(e) => onNamesTextChange(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            One name per line
            {filledNames > 0
              ? ` · ${filledNames} name${filledNames === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onAddHousehold}
          disabled={!canSubmit}
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {filledNames > 1
            ? `Add pin ${label.trim() || "—"} (${filledNames} people)`
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
                  onCancelEdit={onCancelEditPerson}
                  onSave={onSavePerson}
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
