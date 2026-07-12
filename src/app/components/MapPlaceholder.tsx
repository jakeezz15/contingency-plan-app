type MapPlaceholderProps = {
  className?: string;
};

export default function MapPlaceholder({ className }: MapPlaceholderProps) {
  return (
    <div
      className={`rounded-xl border border-gray-300 bg-gray-100 ${
        className ?? "h-96"
      }`}
      aria-hidden="true"
    />
  );
}
