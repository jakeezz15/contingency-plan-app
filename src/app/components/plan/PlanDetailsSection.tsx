"use client";

import CollapsibleSection from "@/app/components/CollapsibleSection";
import { formatPlanDate } from "@/app/lib/plans";

type PlanDetailsSectionProps = {
  isOpen: boolean;
  onToggle: () => void;
  planName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  onPlanNameChange: (value: string) => void;
  onPlanNotesChange: (value: string) => void;
  onExport: () => void;
  onImportClick: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReset: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
};

export default function PlanDetailsSection({
  isOpen,
  onToggle,
  planName,
  planNotes,
  createdAt,
  updatedAt,
  onPlanNameChange,
  onPlanNotesChange,
  onExport,
  onImportClick,
  onImport,
  onReset,
  importInputRef,
}: PlanDetailsSectionProps) {
  return (
    <CollapsibleSection
      id="plan-details"
      title="Plan Details"
      description="Name your plan, add instructions, and manage backups."
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="grid gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Plan Name
          </label>
          <input
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            type="text"
            placeholder="Example: Helsinki Team Plan"
            value={planName}
            onChange={(e) => onPlanNameChange(e.target.value)}
          />
        </div>

        <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
          <p>
            <span className="font-medium text-gray-800">Created:</span>{" "}
            {createdAt ? formatPlanDate(createdAt) : "—"}
          </p>
          <p className="mt-1">
            <span className="font-medium text-gray-800">Last updated:</span>{" "}
            {updatedAt ? formatPlanDate(updatedAt) : "—"}
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Plan Notes / Instructions
        </label>
        <textarea
          className="min-h-24 w-full rounded-lg border border-gray-300 p-3 text-gray-900"
          placeholder="Example: In an emergency, contact the team lead first and meet at the office rally point."
          value={planNotes}
          onChange={(e) => onPlanNotesChange(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onExport}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Export JSON
        </button>

        <button
          type="button"
          onClick={onImportClick}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Import JSON
        </button>

        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          Reset Plan
        </button>

        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={onImport}
        />
      </div>
    </CollapsibleSection>
  );
}
