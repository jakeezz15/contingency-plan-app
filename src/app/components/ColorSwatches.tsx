"use client";

import { PLAN_COLOR_OPTIONS } from "@/app/lib/colors";

type ColorSwatchesProps = {
  value: string;
  onChange: (value: string) => void;
  name: string;
  compact?: boolean;
  label?: string;
};

export default function ColorSwatches({
  value,
  onChange,
  name,
  compact = false,
  label = "Color",
}: ColorSwatchesProps) {
  return (
    <div
      className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}
      role="radiogroup"
      aria-label={label}
    >
      {PLAN_COLOR_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={`relative cursor-pointer rounded-full ${
              selected
                ? "ring-2 ring-gray-900 ring-offset-1"
                : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-1"
            }`}
            title={option.label}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              className={`block rounded-full ${
                compact ? "h-5 w-5" : "h-6 w-6"
              }`}
              style={{ backgroundColor: option.value }}
              aria-hidden="true"
            />
            <span className="sr-only">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}
