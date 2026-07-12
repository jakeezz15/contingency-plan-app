import {
  formatDistanceKm,
  getMeetingPointsByDistance,
} from "@/app/lib/geo";
import type { MeetingPoint, Person } from "@/app/types";

type MeetingPointDistancesProps = {
  person: Person;
  meetingPoints: MeetingPoint[];
  variant?: "card" | "table";
};

export default function MeetingPointDistances({
  person,
  meetingPoints,
  variant = "table",
}: MeetingPointDistancesProps) {
  const ranked = getMeetingPointsByDistance(person, meetingPoints);

  if (ranked.length === 0) {
    return variant === "table" ? <>—</> : null;
  }

  const showNearestLabel = ranked.length > 1;
  const listClass =
    variant === "card" ? "mt-1 space-y-0.5" : "space-y-1";
  const itemClass =
    variant === "card" ? "text-xs text-red-600" : "text-sm text-gray-800";

  return (
    <div className={variant === "card" ? "mt-2" : undefined}>
      {variant === "card" && (
        <p className="text-xs font-medium text-gray-700">Meeting points:</p>
      )}

      <ul className={listClass}>
        {ranked.map(({ point, distanceKm }, index) => (
          <li
            key={point.id}
            className={`${itemClass} ${index === 0 ? "font-semibold" : ""}`}
          >
            🚩 {point.name} ({formatDistanceKm(distanceKm)})
            {index === 0 && showNearestLabel && (
              <span
                className={
                  variant === "card"
                    ? "font-normal text-red-500"
                    : "font-normal text-gray-500"
                }
              >
                {" "}
                nearest
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
