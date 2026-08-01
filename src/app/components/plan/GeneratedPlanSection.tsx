"use client";

import dynamic from "next/dynamic";
import { forwardRef, useEffect, useId, useMemo, useState } from "react";
import ClientOnly from "@/app/components/ClientOnly";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import { PersonLegendLine } from "@/app/components/MemberNameLabel";
import {
  findNearestMeetingPoint,
  formatDistanceKm,
} from "@/app/lib/geo";
import {
  DEFAULT_PERSON_COLOR,
  DEFAULT_ROUTE_COLOR,
  normalizePlanColor,
} from "@/app/lib/colors";
import {
  getPlannedRoutePaths,
  resolveEndpoint,
  type RoutePath,
} from "@/app/lib/routing";
import type { PdfOrientation } from "@/app/lib/pdf";
import type { BasemapId } from "@/app/lib/basemaps";
import type { MeetingPoint, Person, PlannedRoute } from "@/app/types";

function formatCoordinates(lat: number, lng: number) {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

function formatRouteDistance(path: RoutePath) {
  const distance = formatDistanceKm(path.distanceKm);
  if (path.isFallback) {
    return `${distance} approx.`;
  }
  return `${distance} driving`;
}

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

type GeneratedPlanSectionProps = {
  planName: string;
  people: Person[];
  meetingPoints: MeetingPoint[];
  routes?: PlannedRoute[];
  isExportingPdf: boolean;
  onClose: () => void;
  onExportPdf: (orientation: PdfOrientation) => void;
  basemap: BasemapId;
  onBasemapChange: (basemap: BasemapId) => void;
};

const GeneratedPlanSection = forwardRef<HTMLDivElement, GeneratedPlanSectionProps>(
  function GeneratedPlanSection(
    {
      planName,
      people,
      meetingPoints,
      routes = [],
      isExportingPdf,
      onClose,
      onExportPdf,
      basemap,
      onBasemapChange,
    },
    ref
  ) {
    const titleId = useId();
    const [pdfOrientation, setPdfOrientation] =
      useState<PdfOrientation>("landscape");
    const [routePaths, setRoutePaths] = useState<RoutePath[]>([]);
    const [routesLoading, setRoutesLoading] = useState(routes.length > 0);

    useEffect(() => {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      function onKeyDown(event: KeyboardEvent) {
        if (event.key === "Escape") {
          onClose();
        }
      }

      window.addEventListener("keydown", onKeyDown);

      return () => {
        document.body.style.overflow = previousOverflow;
        window.removeEventListener("keydown", onKeyDown);
      };
    }, [onClose]);

    useEffect(() => {
      if (routes.length === 0) {
        setRoutePaths([]);
        setRoutesLoading(false);
        return;
      }

      let cancelled = false;
      setRoutesLoading(true);

      getPlannedRoutePaths(routes, people, meetingPoints).then((paths) => {
        if (!cancelled) {
          setRoutePaths(paths);
          setRoutesLoading(false);
        }
      });

      return () => {
        cancelled = true;
      };
    }, [routes, people, meetingPoints]);

    const legendPeople = useMemo(
      () =>
        [...people].sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true })
        ),
      [people]
    );

    const routesByPersonId = useMemo(() => {
      const map = new Map<number, RoutePath[]>();
      for (const path of routePaths) {
        if (path.from.kind !== "person") continue;
        const list = map.get(path.from.id) ?? [];
        list.push(path);
        map.set(path.from.id, list);
      }
      return map;
    }, [routePaths]);

    return (
      <div
        id="generated-plan"
        className="generated-plan-modal fixed inset-0 z-[1200] flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button
          type="button"
          aria-label="Close generated map"
          className="generated-plan-modal-backdrop absolute inset-0 bg-gray-900/50 print:hidden"
          onClick={onClose}
        />

        <div className="generated-plan-modal-panel relative z-10 flex max-h-[min(94vh,56rem)] w-full max-w-[1480px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl print:max-h-none print:max-w-none print:rounded-none print:shadow-none">
          <div className="generated-plan-actions flex shrink-0 flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="truncate text-base font-semibold text-gray-900 sm:text-lg"
              >
                {planName.trim() || "Generated map"}
              </h2>
              <p className="text-xs text-gray-500">
                Map on page 1 · Legend on page 2
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex rounded-md border border-gray-300 bg-white p-0.5"
                role="group"
                aria-label="PDF page orientation"
              >
                <button
                  type="button"
                  onClick={() => setPdfOrientation("portrait")}
                  disabled={isExportingPdf}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
                    pdfOrientation === "portrait"
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setPdfOrientation("landscape")}
                  disabled={isExportingPdf}
                  className={`rounded px-2.5 py-1.5 text-xs font-medium transition ${
                    pdfOrientation === "landscape"
                      ? "bg-gray-900 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Landscape
                </button>
              </div>

              <button
                type="button"
                onClick={() => onExportPdf(pdfOrientation)}
                disabled={isExportingPdf}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {isExportingPdf ? "Exporting…" : "Export PDF"}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="generated-plan-modal-close rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
              >
                Close
              </button>
            </div>
          </div>

          <div
            ref={ref}
            className="generated-plan-output min-h-0 flex-1 overflow-y-auto overscroll-y-contain bg-white print:overflow-visible"
          >
            <div
              data-pdf-page
              data-pdf-map-export="true"
              className="generated-plan-map-output p-3 sm:p-4 print:mx-auto print:border-0 print:p-0 print:rounded-none"
            >
              <ClientOnly
                fallback={
                  <MapPlaceholder className="h-[min(70vh,40rem)] w-full rounded-lg border-0 print:h-[9.5in] print:rounded-none" />
                }
              >
                <MapPicker
                  mapKey="generated-plan-map"
                  people={people}
                  meetingPoints={meetingPoints}
                  plannedRoutes={routes}
                  selectedLocation={null}
                  large
                  showLegend={false}
                  enablePrintPrepare
                  className="h-[min(70vh,40rem)] w-full rounded-lg print:h-[9.5in] print:rounded-none"
                  basemap={basemap}
                  onBasemapChange={onBasemapChange}
                />
              </ClientOnly>
            </div>

            <div
              data-pdf-page
              data-pdf-align="top"
              className="generated-plan-legend-page border-t border-gray-200 bg-white px-5 py-6 sm:px-8 sm:py-8 print:border-0"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Pin legend
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Who each map number belongs to, with coordinates, planned
                routes, and nearest meeting point
              </p>

              {legendPeople.length === 0 ? (
                <p className="mt-6 text-sm text-gray-500">No pins yet.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {legendPeople.map((person) => {
                    const nearest = findNearestMeetingPoint(
                      person,
                      meetingPoints
                    );
                    const personRoutes = routesByPersonId.get(person.id) ?? [];

                    return (
                      <li
                        key={person.id}
                        className="flex items-start gap-3 text-sm text-gray-900 sm:text-base"
                      >
                        <span
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{
                            backgroundColor: normalizePlanColor(
                              person.color,
                              DEFAULT_PERSON_COLOR
                            ),
                          }}
                          aria-hidden="true"
                        >
                          {person.label || "•"}
                        </span>
                        <div className="min-w-0 pt-0.5 leading-snug">
                          <PersonLegendLine
                            label={person.label}
                            members={person.members}
                          />
                          <p className="mt-1 text-xs text-gray-600 sm:text-sm">
                            Coordinates:{" "}
                            <span className="font-medium text-gray-800 tabular-nums">
                              {formatCoordinates(person.lat, person.lng)}
                            </span>
                          </p>

                          {personRoutes.length > 0 ? (
                            <ul className="mt-1 space-y-0.5">
                              {personRoutes.map((path) => (
                                <li
                                  key={path.id}
                                  className="flex items-start gap-2 text-xs text-gray-600 sm:text-sm"
                                >
                                  <span
                                    className="mt-1.5 inline-block h-1 w-4 shrink-0 rounded-full"
                                    style={{
                                      backgroundColor: normalizePlanColor(
                                        path.color,
                                        DEFAULT_ROUTE_COLOR
                                      ),
                                    }}
                                    aria-hidden="true"
                                  />
                                  <span>
                                    Route to{" "}
                                    <span className="font-medium text-gray-800">
                                      {path.toLabel}
                                    </span>{" "}
                                    (
                                    <span className="tabular-nums">
                                      {formatRouteDistance(path)}
                                    </span>
                                    )
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : null}

                          <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                            {nearest ? (
                              <>
                                Nearest meeting point:{" "}
                                <span className="font-medium text-gray-800">
                                  {nearest.point.name}
                                </span>{" "}
                                (
                                <span className="tabular-nums">
                                  {formatDistanceKm(nearest.distanceKm)} approx.
                                </span>
                                )
                              </>
                            ) : (
                              "No meeting points added"
                            )}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {meetingPoints.length > 0 && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Meeting points
                  </h4>
                  <ul className="mt-3 space-y-3">
                    {meetingPoints.map((point) => (
                      <li
                        key={point.id}
                        className="text-sm text-gray-900 sm:text-base"
                      >
                        <span className="font-medium">{point.name}</span>
                        {point.notes ? (
                          <span className="text-gray-600"> — {point.notes}</span>
                        ) : null}
                        <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                          Coordinates:{" "}
                          <span className="font-medium text-gray-800 tabular-nums">
                            {formatCoordinates(point.lat, point.lng)}
                          </span>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(routes.length > 0 || routePaths.length > 0) && (
                <div className="mt-8 border-t border-gray-100 pt-6">
                  <h4 className="text-sm font-semibold tracking-wide text-gray-500 uppercase">
                    Planned routes
                  </h4>
                  <p className="mt-1 text-xs text-gray-500">
                    Same colors as the map lines. Driving distances when
                    available; otherwise straight-line approx.
                  </p>

                  {routesLoading && routePaths.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">
                      Loading route distances…
                    </p>
                  ) : routePaths.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">
                      No valid routes to show.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-2.5">
                      {routePaths.map((path) => {
                        const from =
                          resolveEndpoint(path.from, people, meetingPoints) ??
                          null;
                        const to =
                          resolveEndpoint(path.to, people, meetingPoints) ??
                          null;

                        return (
                          <li
                            key={path.id}
                            className="flex items-start gap-3 text-sm text-gray-900 sm:text-base"
                          >
                            <span
                              className="mt-2 inline-block h-1.5 w-5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: normalizePlanColor(
                                  path.color,
                                  DEFAULT_ROUTE_COLOR
                                ),
                              }}
                              aria-hidden="true"
                            />
                            <div className="min-w-0 leading-snug">
                              <p>
                                <span className="font-medium">
                                  {from?.label ?? path.fromLabel}
                                </span>
                                <span className="mx-1.5 text-gray-400">→</span>
                                <span className="font-medium">
                                  {to?.label ?? path.toLabel}
                                </span>
                              </p>
                              <p className="mt-0.5 text-xs text-gray-600 sm:text-sm">
                                Distance:{" "}
                                <span className="font-medium text-gray-800 tabular-nums">
                                  {formatRouteDistance(path)}
                                </span>
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default GeneratedPlanSection;
