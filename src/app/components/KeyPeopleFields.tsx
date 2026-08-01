"use client";

import { emptyKeyPersonDraft, type KeyPersonDraft } from "@/app/lib/roles";

type KeyPeopleFieldsProps = {
  keyPeople: KeyPersonDraft[];
  onChange: (next: KeyPersonDraft[]) => void;
  compact?: boolean;
};

export default function KeyPeopleFields({
  keyPeople,
  onChange,
  compact = false,
}: KeyPeopleFieldsProps) {
  function updateRow(index: number, field: keyof KeyPersonDraft, value: string) {
    onChange(
      keyPeople.map((person, personIndex) =>
        personIndex === index ? { ...person, [field]: value } : person
      )
    );
  }

  function addRow() {
    onChange([...keyPeople, emptyKeyPersonDraft()]);
  }

  function removeRow(index: number) {
    if (keyPeople.length <= 1) {
      onChange([emptyKeyPersonDraft()]);
      return;
    }
    onChange(keyPeople.filter((_, personIndex) => personIndex !== index));
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-xs font-medium text-gray-600">
          Name & status
        </label>
        <button
          type="button"
          onClick={addRow}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
        >
          + Add
        </button>
      </div>

      <div className="space-y-2">
        {keyPeople.map((person, index) => (
          <div key={index} className="flex items-start gap-2">
            <input
              className={`min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 text-sm text-gray-900 ${
                compact ? "py-1.5" : "py-2"
              }`}
              type="text"
              placeholder="Name"
              value={person.name}
              onChange={(e) => updateRow(index, "name", e.target.value)}
              aria-label={`Key person name ${index + 1}`}
            />
            <input
              className={`min-w-0 flex-1 rounded-md border border-gray-300 px-2.5 text-sm text-gray-900 ${
                compact ? "py-1.5" : "py-2"
              }`}
              type="text"
              placeholder="Status"
              value={person.status}
              onChange={(e) => updateRow(index, "status", e.target.value)}
              aria-label={`Status for person ${index + 1}`}
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              className={`inline-flex shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 ${
                compact ? "h-8 w-8" : "h-9 w-9"
              }`}
              aria-label={`Remove key person ${index + 1}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <p className="mt-1 text-xs text-gray-500">
        e.g. Team Leader, Rescuer, Medical
      </p>
    </div>
  );
}
