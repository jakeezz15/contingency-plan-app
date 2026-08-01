"use client";

import MemberNameLabel from "@/app/components/MemberNameLabel";
import MeetingPointDistances from "@/app/components/MeetingPointDistances";
import { formatCompactAddress } from "@/app/lib/address";
import { DEFAULT_PERSON_COLOR, normalizePlanColor } from "@/app/lib/colors";
import type { MeetingPoint, Person } from "@/app/types";

type PersonCardProps = {
  person: Person;
  meetingPoints: MeetingPoint[];
  isEditing: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

export default function PersonCard({
  person,
  meetingPoints,
  isEditing,
  onEdit,
  onRemove,
}: PersonCardProps) {
  const members = person.members.filter((member) => member.name.trim());
  const pinColor = normalizePlanColor(person.color, DEFAULT_PERSON_COLOR);

  return (
    <div
      className={`rounded-lg border p-3 ${
        isEditing
          ? "border-blue-300 bg-blue-50/70 ring-1 ring-blue-200"
          : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: pinColor }}
              aria-hidden="true"
            >
              {person.label || "•"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900">
                Pin {person.label || "—"}
                {isEditing ? (
                  <span className="ml-2 font-medium text-blue-700">
                    Editing above
                  </span>
                ) : null}
              </p>
              <p className="truncate text-xs text-gray-600">
                {formatCompactAddress(person.address)}
              </p>
            </div>
          </div>

          {members.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {members.map((member, index) => (
                <span
                  key={`${person.id}-${index}`}
                  className="inline-flex max-w-full items-center rounded bg-white px-2 py-0.5 text-[11px] font-medium text-gray-800 ring-1 ring-gray-200"
                  title={member.phone || undefined}
                >
                  <span className="truncate">
                    <MemberNameLabel member={member} />
                  </span>
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
            {isEditing ? "Editing…" : "Edit"}
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
