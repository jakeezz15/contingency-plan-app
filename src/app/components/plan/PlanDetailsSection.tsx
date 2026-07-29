"use client";

import { formatPlanDate } from "@/app/lib/plans";
import { useState } from "react";

type PlanDetailsSectionProps = {
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
  const [showMore, setShowMore] = useState(false);

  return (
    <div id="plan-details" className="shrink-0 border-b border-gray-200 px-4 py-3">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        Plan name
      </label>
      <div className="flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-900"
          type="text"
          placeholder="Untitled plan"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
        />
        <button
          type="button"
          onClick={() => setShowMore((open) => !open)}
          aria-expanded={showMore}
          className="shrink-0 rounded-md border border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        >
          {showMore ? "Less" : "More"}
        </button>
      </div>

      {showMore && (
        <div className="mt-3 space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Notes
            </label>
            <textarea
              className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              placeholder="Emergency instructions for this plan…"
              value={planNotes}
              onChange={(e) => onPlanNotesChange(e.target.value)}
            />
          </div>

          <p className="text-xs text-gray-500">
            Updated {updatedAt ? formatPlanDate(updatedAt) : "—"}
            {createdAt ? ` · Created ${formatPlanDate(createdAt)}` : ""}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onExport}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Export
            </button>
            <button
              type="button"
              onClick={onImportClick}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Import
            </button>
            <button
              type="button"
              onClick={onReset}
              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Reset
            </button>
          </div>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onImport}
          />
        </div>
      )}
    </div>
  );
}
