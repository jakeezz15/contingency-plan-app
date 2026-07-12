"use client";

import { useId, type ReactNode } from "react";

type CollapsibleSectionProps = {
  id: string;
  title: string;
  description?: string;
  badge?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export default function CollapsibleSection({
  id,
  title,
  description,
  badge,
  isOpen,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  const contentId = useId();

  return (
    <section
      id={id}
      className="scroll-mt-44 overflow-hidden rounded-xl bg-white shadow"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-gray-50"
      >
        <div className="min-w-0">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          {badge}
          <span
            aria-hidden="true"
            className={`inline-block text-sm text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </div>
      </button>

      {isOpen && (
        <div
          id={contentId}
          className="space-y-6 border-t border-gray-100 px-6 pb-6 pt-2"
        >
          {children}
        </div>
      )}
    </section>
  );
}
