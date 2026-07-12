"use client";

import CollapsibleSection from "@/app/components/CollapsibleSection";
import PersonCard from "@/app/components/PersonCard";
import { formatRoleOption, ROLE_DEFINITIONS } from "@/app/lib/roles";
import type { GeocodeResult, MeetingPoint, Person, SelectedLocation } from "@/app/types";

type PeopleSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  people: Person[];
  meetingPoints: MeetingPoint[];
  editingPersonId: number | null;
  generatePlanHint: string;
  canGeneratePlan: boolean;
  name: string;
  role: string;
  phone: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  onNameChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onAddressChange: (value: string) => void;
  onConfirmAddress: () => void;
  onAddPerson: () => void;
  onClearAll: () => void;
  onEditPerson: (id: number) => void;
  onCancelEditPerson: () => void;
  onSavePerson: (person: Person) => void;
  onRemovePerson: (id: number) => void;
};

export default function PeopleSection({
  isOpen,
  onToggle,
  people,
  meetingPoints,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  name,
  role,
  phone,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  onNameChange,
  onRoleChange,
  onPhoneChange,
  onAddressChange,
  onConfirmAddress,
  onAddPerson,
  onClearAll,
  onEditPerson,
  onCancelEditPerson,
  onSavePerson,
  onRemovePerson,
}: PeopleSectionProps) {
  return (
    <CollapsibleSection
      id="people"
      title="People"
      description="Add team members and review saved people."
      badge={
        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
          {people.length}
        </span>
      }
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">
          Add Person
        </h3>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="text"
            placeholder="Example: Juan Dela Cruz"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Role
          </label>
          <select
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            value={role}
            onChange={(e) => onRoleChange(e.target.value)}
          >
            <option value="">Select a role (optional)</option>
            {ROLE_DEFINITIONS.map((definition) => (
              <option key={definition.label} value={definition.label}>
                {formatRoleOption(definition)}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="tel"
            placeholder="Example: +358 40 123 4567"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Address
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="text"
            placeholder="Example: Ruukkupolku 14, Vantaa, Finland"
            value={address}
            onChange={(e) => onAddressChange(e.target.value)}
          />
        </div>

        {searchMessage && (
          <div className="mb-4 rounded-lg bg-white p-3 text-sm text-gray-700">
            {isSearching ? "🔎 " : "📍 "}
            {searchMessage}
          </div>
        )}

        {pendingGeocode && !selectedLocation && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Did you mean this address?</p>
            <p className="mt-1">{pendingGeocode.displayName}</p>
            <button
              type="button"
              onClick={onConfirmAddress}
              className="mt-3 w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Use This Address
            </button>
          </div>
        )}

        {selectedLocation && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Address confirmed.
            <br />
            Lat: {selectedLocation.lat.toFixed(5)}
            <br />
            Lng: {selectedLocation.lng.toFixed(5)}
          </div>
        )}

        <button
          type="button"
          onClick={onAddPerson}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Add Person Marker
        </button>

        <p className="mt-3 text-sm text-gray-500">
          Use complete address, city, and country for better results.
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700">
            Saved People
          </h3>

          {people.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Clear all
            </button>
          )}
        </div>

        {!canGeneratePlan && generatePlanHint && (
          <p className="mb-4 text-sm text-amber-700">{generatePlanHint}</p>
        )}

        {people.length === 0 ? (
          <p className="text-gray-500">No people added yet.</p>
        ) : (
          <div className="grid gap-3">
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
    </CollapsibleSection>
  );
}
