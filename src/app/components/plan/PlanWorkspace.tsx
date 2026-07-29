"use client";

import { useState } from "react";
import MapPreviewPanel from "@/app/components/plan/MapPreviewPanel";
import MeetingPointsSection from "@/app/components/plan/MeetingPointsSection";
import PeopleSection from "@/app/components/plan/PeopleSection";
import PlanDetailsSection from "@/app/components/plan/PlanDetailsSection";
import WorkspaceSplit from "@/app/components/WorkspaceSplit";
import type { BasemapId } from "@/app/lib/basemaps";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
  SelectedLocation,
} from "@/app/types";

type WorkspaceTab = "people" | "meeting-points";

type PlanWorkspaceProps = {
  planName: string;
  planNotes: string;
  createdAt: string;
  updatedAt: string;
  setPlanName: (value: string) => void;
  setPlanNotes: (value: string) => void;
  exportPlan: () => void;
  importInputRef: React.RefObject<HTMLInputElement | null>;
  importPlan: (event: React.ChangeEvent<HTMLInputElement>) => void;
  resetActivePlan: () => void;
  people: Person[];
  meetingPoints: MeetingPoint[];
  editingPersonId: number | null;
  generatePlanHint: string;
  canGeneratePlan: boolean;
  label: string;
  namesText: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  setLabel: (value: string) => void;
  setNamesText: (value: string) => void;
  handlePersonAddressChange: (value: string) => void;
  confirmAddress: () => void;
  addHousehold: () => void;
  clearAllPeople: () => void;
  setEditingPersonId: (id: number | null) => void;
  updatePerson: (person: Person) => void;
  removePerson: (id: number) => void;
  meetingPointName: string;
  meetingPointAddress: string;
  meetingPointNotes: string;
  meetingSearchMessage: string;
  isSearchingMeeting: boolean;
  pendingMeetingGeocode: GeocodeResult | null;
  selectedMeetingLocation: SelectedLocation;
  setMeetingPointName: (value: string) => void;
  handleMeetingPointAddressChange: (value: string) => void;
  setMeetingPointNotes: (value: string) => void;
  confirmMeetingAddress: () => void;
  addMeetingPoint: () => void;
  clearAllMeetingPoints: () => void;
  removeMeetingPoint: (id: number) => void;
  basemap: BasemapId;
  setBasemap: (basemap: BasemapId) => void;
};

export default function PlanWorkspace({
  planName,
  planNotes,
  createdAt,
  updatedAt,
  setPlanName,
  setPlanNotes,
  exportPlan,
  importInputRef,
  importPlan,
  resetActivePlan,
  people,
  meetingPoints,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  label,
  namesText,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  setLabel,
  setNamesText,
  handlePersonAddressChange,
  confirmAddress,
  addHousehold,
  clearAllPeople,
  setEditingPersonId,
  updatePerson,
  removePerson,
  meetingPointName,
  meetingPointAddress,
  meetingPointNotes,
  meetingSearchMessage,
  isSearchingMeeting,
  pendingMeetingGeocode,
  selectedMeetingLocation,
  setMeetingPointName,
  handleMeetingPointAddressChange,
  setMeetingPointNotes,
  confirmMeetingAddress,
  addMeetingPoint,
  clearAllMeetingPoints,
  removeMeetingPoint,
  basemap,
  setBasemap,
}: PlanWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("people");

  return (
    <WorkspaceSplit
      workspace={
        <div className="flex min-h-0 flex-1 flex-col">
          <PlanDetailsSection
            planName={planName}
            planNotes={planNotes}
            createdAt={createdAt}
            updatedAt={updatedAt}
            onPlanNameChange={setPlanName}
            onPlanNotesChange={setPlanNotes}
            onExport={exportPlan}
            onImportClick={() => importInputRef.current?.click()}
            onImport={importPlan}
            onReset={resetActivePlan}
            importInputRef={importInputRef}
          />

          <div className="flex shrink-0 border-b border-gray-200 px-2">
            <TabButton
              active={tab === "people"}
              onClick={() => setTab("people")}
              label="People"
              count={people.length}
            />
            <TabButton
              active={tab === "meeting-points"}
              onClick={() => setTab("meeting-points")}
              label="Meeting points"
              count={meetingPoints.length}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4 pb-0">
            {tab === "people" ? (
              <PeopleSection
                people={people}
                meetingPoints={meetingPoints}
                editingPersonId={editingPersonId}
                generatePlanHint={generatePlanHint}
                canGeneratePlan={canGeneratePlan}
                label={label}
                namesText={namesText}
                address={address}
                searchMessage={searchMessage}
                isSearching={isSearching}
                pendingGeocode={pendingGeocode}
                selectedLocation={selectedLocation}
                onLabelChange={setLabel}
                onNamesTextChange={setNamesText}
                onAddressChange={handlePersonAddressChange}
                onConfirmAddress={confirmAddress}
                onAddHousehold={addHousehold}
                onClearAll={clearAllPeople}
                onEditPerson={setEditingPersonId}
                onCancelEditPerson={() => setEditingPersonId(null)}
                onSavePerson={updatePerson}
                onRemovePerson={removePerson}
              />
            ) : (
              <MeetingPointsSection
                meetingPoints={meetingPoints}
                meetingPointName={meetingPointName}
                meetingPointAddress={meetingPointAddress}
                meetingPointNotes={meetingPointNotes}
                meetingSearchMessage={meetingSearchMessage}
                isSearchingMeeting={isSearchingMeeting}
                pendingMeetingGeocode={pendingMeetingGeocode}
                selectedMeetingLocation={selectedMeetingLocation}
                onNameChange={setMeetingPointName}
                onAddressChange={handleMeetingPointAddressChange}
                onNotesChange={setMeetingPointNotes}
                onConfirmAddress={confirmMeetingAddress}
                onAddMeetingPoint={addMeetingPoint}
                onClearAll={clearAllMeetingPoints}
                onRemoveMeetingPoint={removeMeetingPoint}
              />
            )}
          </div>
        </div>
      }
      map={
        <MapPreviewPanel
          people={people}
          meetingPoints={meetingPoints}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />
      }
    />
  );
}

function TabButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex-1 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-gray-900"
          : "text-gray-500 hover:text-gray-800"
      }`}
    >
      <span className="inline-flex items-center gap-1.5">
        {label}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
          }`}
        >
          {count}
        </span>
      </span>
      {active && (
        <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-gray-900" />
      )}
    </button>
  );
}
