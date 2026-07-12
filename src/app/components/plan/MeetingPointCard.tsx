import { formatCompactAddress } from "@/app/lib/address";
import type { MeetingPoint } from "@/app/types";

type MeetingPointCardProps = {
  point: MeetingPoint;
  onRemove: () => void;
};

export default function MeetingPointCard({
  point,
  onRemove,
}: MeetingPointCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">🚩 {point.name}</p>
          <p className="text-sm text-gray-600">
            {formatCompactAddress(point.address)}
          </p>
          {point.notes && (
            <p className="mt-1 text-sm text-gray-500">{point.notes}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="text-sm font-medium text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
