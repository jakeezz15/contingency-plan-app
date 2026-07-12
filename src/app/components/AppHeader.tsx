"use client";

import type { SavedPlan } from "@/app/types";

type NavSection =
  | "plan-details"
  | "people"
  | "meeting-points"
  | "map-preview"
  | "generated-plan";

type AppHeaderProps = {
  plans: SavedPlan[];
  activePlanId: string;
  onSwitchPlan: (id: string) => void;
  onCreatePlan: () => void;
  onDeletePlan: () => void;
  canDeletePlan: boolean;
  onNavigate: (sectionId: NavSection) => void;
  onGenerate: () => void;
  canGenerate: boolean;
  showOutputNav: boolean;
  formatDate: (isoDate: string) => string;
};

const NAV_ITEMS: { id: NavSection; label: string; requiresOutput?: boolean }[] =
  [
    { id: "plan-details", label: "Plan" },
    { id: "people", label: "People" },
    { id: "meeting-points", label: "Meeting Points" },
    { id: "map-preview", label: "Map" },
    { id: "generated-plan", label: "Output", requiresOutput: true },
  ];

export default function AppHeader({
  plans,
  activePlanId,
  onSwitchPlan,
  onCreatePlan,
  onDeletePlan,
  canDeletePlan,
  onNavigate,
  onGenerate,
  canGenerate,
  showOutputNav,
  formatDate,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-[1100] border-b border-gray-200 bg-white shadow-sm print:hidden">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-gray-900 sm:text-xl">
              Contingency Plan Map Generator
            </h1>
            <p className="hidden text-sm text-gray-500 sm:block">
              Build a printable emergency plan with people, contacts, and map
              markers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="plan-select">
              Active plan
            </label>
            <select
              id="plan-select"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 p-2 text-sm text-gray-900 sm:max-w-xs sm:flex-none"
              value={plans.some((plan) => plan.id === activePlanId) ? activePlanId : ""}
              onChange={(e) => onSwitchPlan(e.target.value)}
            >
              {plans.length === 0 ? (
                <option value="">Loading plans...</option>
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
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              + New
            </button>

            <button
              type="button"
              onClick={onDeletePlan}
              disabled={!canDeletePlan}
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>

            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </div>

        {/* <nav
          aria-label="Workspace sections"
          className="mt-3 flex gap-1 overflow-x-auto border-t border-gray-100 pt-3"
        >
          {NAV_ITEMS.filter(
            (item) => !item.requiresOutput || showOutputNav
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </button>
          ))}
        </nav> */}
      </div>
    </header>
  );
}
