"use client";

import { useEffect, useState } from "react";
import { geocodeAddress } from "@/app/lib/geocode";
import { findNearestMeetingPoint, formatDistanceKm } from "@/app/lib/geo";
import {
  formatRoleOption,
  getRoleDefinition,
  ROLE_DEFINITIONS,
} from "@/app/lib/roles";
import type { GeocodeResult, MeetingPoint, Person } from "@/app/types";

type PersonCardProps = {
  person: Person;
  meetingPoints: MeetingPoint[];
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSave: (updatedPerson: Person) => void;
  onRemove: () => void;
};

export default function PersonCard({
  person,
  meetingPoints,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onRemove,
}: PersonCardProps) {
  if (isEditing) {
    return (
      <PersonEditForm person={person} onCancel={onCancelEdit} onSave={onSave} />
    );
  }

  const nearest = findNearestMeetingPoint(person, meetingPoints);
  const roleDefinition = getRoleDefinition(person.role);

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm shadow-sm"
              style={{ backgroundColor: roleDefinition.color }}
              aria-hidden="true"
            >
              {roleDefinition.emoji}
            </span>
            <p className="font-semibold text-gray-900">{person.name}</p>
          </div>
          {person.role && (
            <p className="mt-1 text-sm font-medium text-blue-700">
              {person.role}
            </p>
          )}
          {person.phone && (
            <p className="text-sm text-gray-700">{person.phone}</p>
          )}
          <p className="text-sm text-gray-600">{person.address}</p>
          <p className="mt-1 text-xs text-gray-400">
            {person.lat.toFixed(5)}, {person.lng.toFixed(5)}
          </p>
          {nearest && (
            <p className="mt-1 text-xs text-red-600">
              🚩 Nearest meeting point: {nearest.point.name} (
              {formatDistanceKm(nearest.distanceKm)})
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onEdit}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={onRemove}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

type PersonEditFormProps = {
  person: Person;
  onCancel: () => void;
  onSave: (updatedPerson: Person) => void;
};

function PersonEditForm({ person, onCancel, onSave }: PersonEditFormProps) {
  const [name, setName] = useState(person.name);
  const [role, setRole] = useState(person.role);
  const [phone, setPhone] = useState(person.phone);
  const [address, setAddress] = useState(person.address);
  const [pendingGeocode, setPendingGeocode] = useState<GeocodeResult | null>(
    null
  );
  const [confirmedLocation, setConfirmedLocation] =
    useState<GeocodeResult | null>(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmedAddress = address.trim();
    const addressUnchanged =
      trimmedAddress.toLowerCase() === person.address.trim().toLowerCase();

    if (addressUnchanged || trimmedAddress.length < 5) {
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchMessage("Searching updated address...");

        const result = await geocodeAddress(trimmedAddress);
        setPendingGeocode(result);
        setSearchMessage("Confirm the updated address before saving.");
      } catch (error) {
        setPendingGeocode(null);
        setConfirmedLocation(null);
        setSearchMessage(
          error instanceof Error ? error.message : "Address search failed."
        );
      } finally {
        setIsSearching(false);
      }
    }, 1000);

    return () => clearTimeout(delaySearch);
  }, [address, person.address]);

  function confirmAddress() {
    if (!pendingGeocode) return;

    setConfirmedLocation(pendingGeocode);
    setSearchMessage("Updated address confirmed.");
  }

  function handleSave() {
    if (!name.trim() || !address.trim()) {
      alert("Please enter both name and address.");
      return;
    }

    const addressChanged =
      address.trim().toLowerCase() !== person.address.trim().toLowerCase();

    if (addressChanged && !confirmedLocation) {
      alert("Please confirm the updated address before saving.");
      return;
    }

    onSave({
      ...person,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      address: addressChanged
        ? confirmedLocation!.displayName
        : person.address,
      lat: addressChanged ? confirmedLocation!.lat : person.lat,
      lng: addressChanged ? confirmedLocation!.lng : person.lng,
    });
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold text-gray-900">Editing person</p>
        <button
          onClick={onCancel}
          className="text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-3">
        <input
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
        />

        <select
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Select a role (optional)</option>
          {ROLE_DEFINITIONS.map((definition) => (
            <option key={definition.label} value={definition.label}>
              {formatRoleOption(definition)}
            </option>
          ))}
        </select>

        <input
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
        />

        <input
          className="w-full rounded-lg border border-gray-300 p-2 text-gray-900"
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setConfirmedLocation(null);
            setPendingGeocode(null);
            setSearchMessage("");
          }}
          placeholder="Address"
        />

        {searchMessage && (
          <div className="rounded-lg bg-white p-3 text-sm text-gray-700">
            {isSearching ? "🔎 " : "📍 "}
            {searchMessage}
          </div>
        )}

        {pendingGeocode && !confirmedLocation && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">Did you mean this address?</p>
            <p className="mt-1">{pendingGeocode.displayName}</p>
            <button
              onClick={confirmAddress}
              className="mt-3 rounded-lg bg-amber-600 px-3 py-2 font-semibold text-white hover:bg-amber-700"
            >
              Use This Address
            </button>
          </div>
        )}

        {confirmedLocation && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
            Updated address confirmed.
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
