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
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{point.name}</p>
          <p className="text-xs text-gray-600">
            {formatCompactAddress(point.address)}
          </p>
          {point.notes && (
            <p className="mt-1 text-xs text-gray-500">{point.notes}</p>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
