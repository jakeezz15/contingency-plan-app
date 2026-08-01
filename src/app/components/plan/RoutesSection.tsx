"use client";

import { useMemo, useState } from "react";
import ColorSwatches from "@/app/components/ColorSwatches";
import {
  DEFAULT_ROUTE_COLOR,
  normalizePlanColor,
  suggestNextPlanColor,
} from "@/app/lib/colors";
import {
  listRouteEndpointOptions,
  parseEndpointKey,
  resolveEndpoint,
} from "@/app/lib/routing";
import type {
  MeetingPoint,
  Person,
  PlannedRoute,
  RouteEndpointRef,
} from "@/app/types";

type RoutesSectionProps = {
  people: Person[];
  meetingPoints: MeetingPoint[];
  routes: PlannedRoute[];
  onAddRoute: (
    from: RouteEndpointRef,
    to: RouteEndpointRef,
    color: string
  ) => void;
  onUpdateRouteColor: (id: string, color: string) => void;
  onRemoveRoute: (id: string) => void;
  onClearAll: () => void;
};

export default function RoutesSection({
  people,
  meetingPoints,
  routes,
  onAddRoute,
  onUpdateRouteColor,
  onRemoveRoute,
  onClearAll,
}: RoutesSectionProps) {
  const options = useMemo(
    () => listRouteEndpointOptions(people, meetingPoints),
    [people, meetingPoints]
  );

  const suggestedColor = useMemo(
    () => suggestNextPlanColor(routes.map((route) => route.color)),
    [routes]
  );

  const [fromKey, setFromKey] = useState("");
  const [toKey, setToKey] = useState("");
  const [color, setColor] = useState(suggestedColor);

  const draftColor = normalizePlanColor(color, DEFAULT_ROUTE_COLOR);
  const canChoose = options.length >= 2;

  function handleAdd() {
    const from = parseEndpointKey(fromKey);
    const to = parseEndpointKey(toKey);
    if (!from || !to) {
      alert("Choose both a start and an end.");
      return;
    }
    if (from.kind === to.kind && from.id === to.id) {
      alert("Start and end must be different places.");
      return;
    }

    onAddRoute(from, to, draftColor);
    setFromKey("");
    setToKey("");
    setColor(
      suggestNextPlanColor([...routes.map((route) => route.color), draftColor])
    );
  }

  return (
    <div id="routes" className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-gray-100 pb-4">
        <p className="text-xs text-gray-500">
          Choose which paths to show on the map — for example pin 1 to a
          meeting point, or pin 2 to pin 3. Pick a color so routes are easy to
          tell apart.
        </p>

        {!canChoose ? (
          <p className="rounded-md border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Add at least two people pins and/or meeting points before creating
            a route.
          </p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                From
              </label>
              <EndpointSelect
                value={fromKey}
                onChange={setFromKey}
                options={options}
                excludeKey={toKey}
                placeholder="Start point"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                To
              </label>
              <EndpointSelect
                value={toKey}
                onChange={setToKey}
                options={options}
                excludeKey={fromKey}
                placeholder="End point"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                Color
              </label>
              <ColorSwatches
                value={draftColor}
                onChange={setColor}
                name="new-route-color"
                label="Route color"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!fromKey || !toKey}
              className="w-full rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Add route
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Saved routes ({routes.length})
          </h3>
          {routes.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Clear all
            </button>
          )}
        </div>

        {routes.length === 0 ? (
          <p className="text-sm text-gray-500">No routes yet.</p>
        ) : (
          <ul className="space-y-2">
            {routes.map((route) => {
              const from = resolveEndpoint(route.from, people, meetingPoints);
              const to = resolveEndpoint(route.to, people, meetingPoints);
              return (
                <li
                  key={route.id}
                  className="rounded-md border border-gray-200 bg-white px-3 py-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm text-gray-900">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: route.color }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="font-medium">
                          {from?.label ?? "Missing"}
                        </span>
                        <span className="mx-1.5 text-gray-400">→</span>
                        <span className="font-medium">
                          {to?.label ?? "Missing"}
                        </span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveRoute(route.id)}
                      className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-2">
                    <ColorSwatches
                      value={route.color}
                      onChange={(next) => onUpdateRouteColor(route.id, next)}
                      name={`route-color-${route.id}`}
                      label="Route color"
                      compact
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function EndpointSelect({
  value,
  onChange,
  options,
  excludeKey,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReturnType<typeof listRouteEndpointOptions>;
  excludeKey: string;
  placeholder: string;
}) {
  const peopleOptions = options.filter(
    (option) => option.group === "People" && option.key !== excludeKey
  );
  const meetingOptions = options.filter(
    (option) => option.group === "Meeting points" && option.key !== excludeKey
  );

  return (
    <select
      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {peopleOptions.length > 0 && (
        <optgroup label="People">
          {peopleOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </optgroup>
      )}
      {meetingOptions.length > 0 && (
        <optgroup label="Meeting points">
          {meetingOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}
