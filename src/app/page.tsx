"use client";

import AppHeader from "@/app/components/AppHeader";
import GeneratedPlanSection from "@/app/components/plan/GeneratedPlanSection";
import PlanWorkspace from "@/app/components/plan/PlanWorkspace";
import { useContingencyPlan } from "@/app/hooks/useContingencyPlan";
import { formatPlanDate } from "@/app/lib/plans";

export default function Home() {
  const {
    plans,
    activePlanId,
    planName,
    planNotes,
    createdAt,
    updatedAt,
    address,
    label,
    keyPeople,
    namesText,
    people,
    selectedLocation,
    pendingGeocode,
    isSearching,
    searchMessage,
    meetingPointName,
    meetingPointAddress,
    meetingPointNotes,
    meetingPoints,
    routes,
    selectedMeetingLocation,
    pendingMeetingGeocode,
    isSearchingMeeting,
    meetingSearchMessage,
    showGeneratedPlan,
    editingPersonId,
    isExportingPdf,
    basemap,
    importInputRef,
    generatedPlanRef,
    canGeneratePlan,
    generatePlanHint,
    setPlanName,
    setPlanNotes,
    setLabel,
    setKeyPeople,
    setNamesText,
    handlePersonAddressChange,
    setMeetingPointName,
    handleMeetingPointAddressChange,
    setMeetingPointNotes,
    setBasemap,
    switchToPlan,
    createNewPlan,
    deleteActivePlan,
    generatePlan,
    closeGeneratedPlan,
    exportPdf,
    exportPlan,
    importPlan,
    confirmAddress,
    confirmMeetingAddress,
    addHousehold,
    startEditPerson,
    cancelEditPerson,
    removePerson,
    clearAllPeople,
    addMeetingPoint,
    removeMeetingPoint,
    clearAllMeetingPoints,
    addRoute,
    updateRouteColor,
    removeRoute,
    clearAllRoutes,
    resetActivePlan,
    pinLocationOnMap,
  } = useContingencyPlan();

  return (
    <main className="min-h-screen bg-gray-100 print:bg-white">
      <AppHeader
        plans={plans}
        activePlanId={activePlanId}
        onSwitchPlan={switchToPlan}
        onCreatePlan={createNewPlan}
        onDeletePlan={deleteActivePlan}
        canDeletePlan={plans.length > 1}
        onGenerate={generatePlan}
        canGenerate={canGeneratePlan}
        formatDate={formatPlanDate}
      />

      <div className="print:hidden">
        <PlanWorkspace
          planName={planName}
          planNotes={planNotes}
          createdAt={createdAt}
          updatedAt={updatedAt}
          setPlanName={setPlanName}
          setPlanNotes={setPlanNotes}
          exportPlan={exportPlan}
          importInputRef={importInputRef}
          importPlan={importPlan}
          resetActivePlan={resetActivePlan}
          people={people}
          meetingPoints={meetingPoints}
          routes={routes}
          editingPersonId={editingPersonId}
          generatePlanHint={generatePlanHint}
          canGeneratePlan={canGeneratePlan}
          label={label}
          keyPeople={keyPeople}
          namesText={namesText}
          address={address}
          searchMessage={searchMessage}
          isSearching={isSearching}
          pendingGeocode={pendingGeocode}
          selectedLocation={selectedLocation}
          setLabel={setLabel}
          setKeyPeople={setKeyPeople}
          setNamesText={setNamesText}
          handlePersonAddressChange={handlePersonAddressChange}
          confirmAddress={confirmAddress}
          addHousehold={addHousehold}
          clearAllPeople={clearAllPeople}
          startEditPerson={startEditPerson}
          cancelEditPerson={cancelEditPerson}
          removePerson={removePerson}
          meetingPointName={meetingPointName}
          meetingPointAddress={meetingPointAddress}
          meetingPointNotes={meetingPointNotes}
          meetingSearchMessage={meetingSearchMessage}
          isSearchingMeeting={isSearchingMeeting}
          pendingMeetingGeocode={pendingMeetingGeocode}
          selectedMeetingLocation={selectedMeetingLocation}
          setMeetingPointName={setMeetingPointName}
          handleMeetingPointAddressChange={handleMeetingPointAddressChange}
          setMeetingPointNotes={setMeetingPointNotes}
          confirmMeetingAddress={confirmMeetingAddress}
          addMeetingPoint={addMeetingPoint}
          clearAllMeetingPoints={clearAllMeetingPoints}
          removeMeetingPoint={removeMeetingPoint}
          addRoute={addRoute}
          updateRouteColor={updateRouteColor}
          removeRoute={removeRoute}
          clearAllRoutes={clearAllRoutes}
          basemap={basemap}
          setBasemap={setBasemap}
          pinLocationOnMap={pinLocationOnMap}
        />
      </div>

      {showGeneratedPlan && (
        <GeneratedPlanSection
          ref={generatedPlanRef}
          planName={planName}
          people={people}
          meetingPoints={meetingPoints}
          routes={routes}
          isExportingPdf={isExportingPdf}
          onClose={closeGeneratedPlan}
          onExportPdf={exportPdf}
          basemap={basemap}
          onBasemapChange={setBasemap}
        />
      )}
    </main>
  );
}
