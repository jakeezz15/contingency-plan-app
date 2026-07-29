"use client";

import { useEffect, useState } from "react";
import { formatCompactAddress } from "@/app/lib/address";
import { geocodeAddress } from "@/app/lib/geocode";
import MeetingPointDistances from "@/app/components/MeetingPointDistances";
import { parseNamesText, PERSON_MARKER } from "@/app/lib/roles";
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

  const names = person.members.map((member) => member.name).filter(Boolean);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: PERSON_MARKER.color }}
              aria-hidden="true"
            >
              {person.label || "•"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                Pin {person.label || "—"}
              </p>
              <p className="truncate text-xs text-gray-600">
                {formatCompactAddress(person.address)}
              </p>
            </div>
          </div>

          {names.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {person.members
                .filter((member) => member.name.trim())
                .map((member, index) => (
                  <span
                    key={`${person.id}-${index}`}
                    className="inline-flex max-w-full items-center rounded bg-white px-2 py-0.5 text-[11px] font-medium text-gray-800 ring-1 ring-gray-200"
                    title={member.phone || undefined}
                  >
                    <span className="truncate">{member.name}</span>
                  </span>
                ))}
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-500">No names</p>
          )}

          <MeetingPointDistances
            person={person}
            meetingPoints={meetingPoints}
            variant="card"
          />
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            onClick={onEdit}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
          <button
            onClick={onRemove}
            className="text-xs font-medium text-red-600 hover:text-red-800"
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
  const [label, setLabel] = useState(person.label);
  const [namesText, setNamesText] = useState(
    person.members.map((member) => member.name).filter(Boolean).join("\n")
  );
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
    if (!address.trim()) {
      alert("Please enter an address.");
      return;
    }

    if (!label.trim()) {
      alert("Please enter a map label (for example a number).");
      return;
    }

    const names = parseNamesText(namesText);

    if (names.length === 0) {
      alert("Please enter at least one name (one per line).");
      return;
    }

    const previousByName = new Map(
      person.members.map((member) => [
        member.name.trim().toLowerCase(),
        member.phone,
      ])
    );

    const filledMembers = names.map((name) => ({
      name,
      phone: previousByName.get(name.toLowerCase()) ?? "",
    }));

    const addressChanged =
      address.trim().toLowerCase() !== person.address.trim().toLowerCase();

    if (addressChanged && !confirmedLocation) {
      alert("Please confirm the updated address before saving.");
      return;
    }

    onSave({
      ...person,
      label: label.trim(),
      members: filledMembers,
      address: addressChanged
        ? confirmedLocation!.compactAddress
        : person.address,
      lat: addressChanged ? confirmedLocation!.lat : person.lat,
      lng: addressChanged ? confirmedLocation!.lng : person.lng,
    });
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-gray-900">Edit pin</p>
        <button
          onClick={onCancel}
          className="text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="sm:w-24">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Label
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-semibold text-gray-900"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="1"
              maxLength={4}
            />
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Address
            </label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
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
          </div>
        </div>

        {isSearching && (
          <p className="text-xs text-gray-500">Searching address…</p>
        )}

        {searchMessage && !pendingGeocode && !confirmedLocation && (
          <p className="text-xs text-amber-700">{searchMessage}</p>
        )}

        {pendingGeocode && !confirmedLocation && (
          <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-900">
                Confirm address
              </p>
              <p className="text-sm text-amber-900">
                {pendingGeocode.compactAddress}
              </p>
            </div>
            <button
              onClick={confirmAddress}
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Use this
            </button>
          </div>
        )}

        {confirmedLocation && (
          <p className="text-sm font-medium text-green-700">
            ✓ Updated address ready
          </p>
        )}

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Names
          </label>
          <textarea
            className="min-h-24 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            placeholder={"John\nJohnny\nJane"}
            value={namesText}
            onChange={(e) => setNamesText(e.target.value)}
          />
          <p className="mt-1.5 text-xs text-gray-500">
            One name per line (commas also work).
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white hover:bg-blue-700"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
