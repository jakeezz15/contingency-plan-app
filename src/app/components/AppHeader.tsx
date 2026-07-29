"use client";

import type { SavedPlan } from "@/app/types";

type AppHeaderProps = {
  plans: SavedPlan[];
  activePlanId: string;
  onSwitchPlan: (id: string) => void;
  onCreatePlan: () => void;
  onDeletePlan: () => void;
  canDeletePlan: boolean;
  onGenerate: () => void;
  canGenerate: boolean;
  formatDate: (isoDate: string) => string;
};

export default function AppHeader({
  plans,
  activePlanId,
  onSwitchPlan,
  onCreatePlan,
  onDeletePlan,
  canDeletePlan,
  onGenerate,
  canGenerate,
  formatDate,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-[1100] border-b border-gray-200 bg-white/95 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6">
        <div className="min-w-0 shrink">
          <h1 className="truncate text-base font-bold tracking-tight text-gray-900 sm:text-lg">
            Contingency Plan
          </h1>
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-none">
          <label className="sr-only" htmlFor="plan-select">
            Active plan
          </label>
          <select
            id="plan-select"
            className="min-w-0 max-w-[40vw] flex-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 sm:max-w-xs sm:flex-none"
            value={
              plans.some((plan) => plan.id === activePlanId) ? activePlanId : ""
            }
            onChange={(e) => onSwitchPlan(e.target.value)}
          >
            {plans.length === 0 ? (
              <option value="">Loading…</option>
            ) : (
              plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.planName.trim() || "Untitled Plan"}
                  {plan.updatedAt ? ` — ${formatDate(plan.updatedAt)}` : ""}
                </option>
              ))
            )}
          </select>

          <button
            type="button"
            onClick={onCreatePlan}
            className="shrink-0 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            New
          </button>

          <button
            type="button"
            onClick={onDeletePlan}
            disabled={!canDeletePlan}
            className="hidden shrink-0 rounded-md border border-gray-300 px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate}
            className="shrink-0 rounded-md bg-gray-900 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Generate map
          </button>
        </div>
      </div>
    </header>
  );
}
