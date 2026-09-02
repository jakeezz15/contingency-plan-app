"use client";

import { useState } from "react";
import MapPreviewPanel from "@/app/components/plan/MapPreviewPanel";
import MeetingPointsSection from "@/app/components/plan/MeetingPointsSection";
import PeopleSection from "@/app/components/plan/PeopleSection";
import PlanDetailsSection from "@/app/components/plan/PlanDetailsSection";
import RoutesSection from "@/app/components/plan/RoutesSection";
import WorkspaceSplit from "@/app/components/WorkspaceSplit";
import type { BasemapId } from "@/app/lib/basemaps";
import type { KeyPersonDraft } from "@/app/lib/roles";
import type {
  GeocodeResult,
  MeetingPoint,
  Person,
  PlannedRoute,
  RouteEndpointRef,
  SelectedLocation,
} from "@/app/types";

type WorkspaceTab = "people" | "meeting-points" | "routes";

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
  routes: PlannedRoute[];
  editingPersonId: number | null;
  generatePlanHint: string;
  canGeneratePlan: boolean;
  label: string;
  labelColor: string;
  keyPeople: KeyPersonDraft[];
  namesText: string;
  address: string;
  searchMessage: string;
  isSearching: boolean;
  pendingGeocode: GeocodeResult | null;
  selectedLocation: SelectedLocation;
  setLabel: (value: string) => void;
  setLabelColor: (value: string) => void;
  setKeyPeople: (value: KeyPersonDraft[]) => void;
  setNamesText: (value: string) => void;
  handlePersonAddressChange: (value: string) => void;
  confirmAddress: () => void;
  addHousehold: () => void;
  clearAllPeople: () => void;
  startEditPerson: (id: number) => void;
  cancelEditPerson: () => void;
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
  addRoute: (
    from: RouteEndpointRef,
    to: RouteEndpointRef,
    color: string
  ) => void;
  updateRouteColor: (id: string, color: string) => void;
  removeRoute: (id: string) => void;
  clearAllRoutes: () => void;
  basemap: BasemapId;
  setBasemap: (basemap: BasemapId) => void;
  pinLocationOnMap: (
    lat: number,
    lng: number,
    target: "person" | "meeting"
  ) => void;
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
  routes,
  editingPersonId,
  generatePlanHint,
  canGeneratePlan,
  label,
  labelColor,
  keyPeople,
  namesText,
  address,
  searchMessage,
  isSearching,
  pendingGeocode,
  selectedLocation,
  setLabel,
  setLabelColor,
  setKeyPeople,
  setNamesText,
  handlePersonAddressChange,
  confirmAddress,
  addHousehold,
  clearAllPeople,
  startEditPerson,
  cancelEditPerson,
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
  addRoute,
  updateRouteColor,
  removeRoute,
  clearAllRoutes,
  basemap,
  setBasemap,
  pinLocationOnMap,
}: PlanWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("people");
  const pinTarget = tab === "meeting-points" ? "meeting" : "person";

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

          <div className="flex shrink-0 gap-1 border-b border-gray-200 bg-gray-100 px-2 py-2">
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
            <TabButton
              active={tab === "routes"}
              onClick={() => setTab("routes")}
              label="Routes"
              count={routes.length}
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
                labelColor={labelColor}
                keyPeople={keyPeople}
                namesText={namesText}
                address={address}
                searchMessage={searchMessage}
                isSearching={isSearching}
                pendingGeocode={pendingGeocode}
                selectedLocation={selectedLocation}
                onLabelChange={setLabel}
                onLabelColorChange={setLabelColor}
                onKeyPeopleChange={setKeyPeople}
                onNamesTextChange={setNamesText}
                onAddressChange={handlePersonAddressChange}
                onConfirmAddress={confirmAddress}
                onAddHousehold={addHousehold}
                onClearAll={clearAllPeople}
                onEditPerson={startEditPerson}
                onCancelEditPerson={cancelEditPerson}
                onRemovePerson={removePerson}
              />
            ) : tab === "meeting-points" ? (
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
            ) : (
              <RoutesSection
                people={people}
                meetingPoints={meetingPoints}
                routes={routes}
                onAddRoute={addRoute}
                onUpdateRouteColor={updateRouteColor}
                onRemoveRoute={removeRoute}
                onClearAll={clearAllRoutes}
              />
            )}
          </div>
        </div>
      }
      map={
        <MapPreviewPanel
          people={people}
          meetingPoints={meetingPoints}
          plannedRoutes={routes}
          selectedLocation={selectedLocation}
          selectedMeetingLocation={selectedMeetingLocation}
          basemap={basemap}
          onBasemapChange={setBasemap}
          pinTarget={pinTarget}
          onMapPin={
            tab === "routes"
              ? undefined
              : (lat, lng) => pinLocationOnMap(lat, lng, pinTarget)
          }
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
      className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
        active
          ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-300"
          : "text-gray-600 hover:bg-gray-200/70 hover:text-gray-900"
      }`}
    >
      <span className="inline-flex items-center justify-center gap-1.5">
        {label}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
            active ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          {count}
        </span>
      </span>
    </button>
  );
}
