"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import ClientOnly from "@/app/components/ClientOnly";
import MapPlaceholder from "@/app/components/MapPlaceholder";
import { findNearestMeetingPoint, formatDistanceKm } from "@/app/lib/geo";
import { formatPlanDate } from "@/app/lib/plans";
import type { MeetingPoint, Person } from "@/app/types";

const MapPicker = dynamic(() => import("@/app/components/MapPicker"), {
  ssr: false,
});

type GeneratedPlanSectionProps = {
  displayPlanName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  people: Person[];
  meetingPoints: MeetingPoint[];
  isExportingPdf: boolean;
  onExportPdf: () => void;
  onPrintPlan: () => void;
};

const GeneratedPlanSection = forwardRef<HTMLElement, GeneratedPlanSectionProps>(
  function GeneratedPlanSection(
    {
      displayPlanName,
      planNotes,
      createdAt,
      updatedAt,
      people,
      meetingPoints,
      isExportingPdf,
      onExportPdf,
      onPrintPlan,
    },
    ref
  ) {
    return (
      <section
        id="generated-plan"
        ref={ref}
        className="relative z-0 scroll-mt-44 rounded-xl bg-white p-6 text-gray-900 shadow print:mt-0 print:shadow-none mt-10"
      >
        <div className="mb-4 flex flex-col gap-3 print:block">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {displayPlanName}
            </h2>

            <p className="text-gray-800">
              Total marked addresses: {people.length}
              {meetingPoints.length > 0 &&
                ` · Meeting points: ${meetingPoints.length}`}
            </p>

            <div className="mt-2 text-sm text-gray-700">
              <p>Created: {createdAt ? formatPlanDate(createdAt) : "—"}</p>
              <p>
                Last updated: {updatedAt ? formatPlanDate(updatedAt) : "—"}
              </p>
            </div>

            {planNotes.trim() && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <p className="mb-1 font-semibold text-gray-900">Plan Notes</p>
                <p className="whitespace-pre-wrap">{planNotes}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row print:hidden">
            <button
              type="button"
              onClick={onExportPdf}
              disabled={isExportingPdf}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingPdf ? "Exporting PDF..." : "Export PDF"}
            </button>

            <button
              type="button"
              onClick={onPrintPlan}
              className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-black"
            >
              Print Plan
            </button>
          </div>
        </div>

        <ClientOnly
          fallback={<MapPlaceholder className="h-[650px] print:h-[9.5in]" />}
        >
          <MapPicker
            mapKey="generated-plan-map"
            people={people}
            meetingPoints={meetingPoints}
            selectedLocation={null}
            large
            showLegend={false}
            enablePrintPrepare
            className="h-[650px] print:h-[9.5in]"
          />
        </ClientOnly>

        <div className="mt-6 print:break-inside-avoid">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            People & Contact List
          </h3>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm text-gray-900">
              <thead className="bg-gray-50 text-gray-800">
                <tr>
                  <th className="border-b p-3 font-semibold">#</th>
                  <th className="border-b p-3 font-semibold">Name</th>
                  <th className="border-b p-3 font-semibold">Role</th>
                  <th className="border-b p-3 font-semibold">Phone</th>
                  <th className="border-b p-3 font-semibold">Address</th>
                  <th className="border-b p-3 font-semibold">Coordinates</th>
                  {meetingPoints.length > 0 && (
                    <th className="border-b p-3 font-semibold">
                      Nearest Meeting Point
                    </th>
                  )}
                </tr>
              </thead>

              <tbody>
                {people.map((person, index) => {
                  const nearest = findNearestMeetingPoint(person, meetingPoints);

                  return (
                    <tr key={person.id} className="print:break-inside-avoid">
                      <td className="border-b p-3">{index + 1}</td>
                      <td className="border-b p-3 font-medium">{person.name}</td>
                      <td className="border-b p-3">{person.role || "—"}</td>
                      <td className="border-b p-3">{person.phone || "—"}</td>
                      <td className="border-b p-3">{person.address}</td>
                      <td className="border-b p-3 text-gray-600">
                        {person.lat.toFixed(5)}, {person.lng.toFixed(5)}
                      </td>
                      {meetingPoints.length > 0 && (
                        <td className="border-b p-3">
                          {nearest
                            ? `🚩 ${nearest.point.name} (${formatDistanceKm(
                                nearest.distanceKm
                              )})`
                            : "—"}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {meetingPoints.length > 0 && (
          <div className="mt-6 print:break-inside-avoid">
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Meeting Points
            </h3>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm text-gray-900">
                <thead className="bg-gray-50 text-gray-800">
                  <tr>
                    <th className="border-b p-3 font-semibold">#</th>
                    <th className="border-b p-3 font-semibold">Name</th>
                    <th className="border-b p-3 font-semibold">Address</th>
                    <th className="border-b p-3 font-semibold">Notes</th>
                    <th className="border-b p-3 font-semibold">Coordinates</th>
                  </tr>
                </thead>

                <tbody>
                  {meetingPoints.map((point, index) => (
                    <tr key={point.id} className="print:break-inside-avoid">
                      <td className="border-b p-3">{index + 1}</td>
                      <td className="border-b p-3 font-medium">
                        🚩 {point.name}
                      </td>
                      <td className="border-b p-3">{point.address}</td>
                      <td className="border-b p-3">{point.notes || "—"}</td>
                      <td className="border-b p-3 text-gray-600">
                        {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    );
  }
);

export default GeneratedPlanSection;
