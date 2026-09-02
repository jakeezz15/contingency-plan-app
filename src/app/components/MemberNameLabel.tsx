type MemberLike = {
  name: string;
  status?: string;
};

/** Renders a person name with status in bold italic when present. */
export default function MemberNameLabel({
  member,
  className,
}: {
  member: MemberLike;
  className?: string;
}) {
  const name = member.name.trim();
  const status = member.status?.trim() ?? "";

  if (!name) return null;

  return (
    <span className={className}>
      {name}
      {status ? (
        <>
          {" "}
          (
          <span className="font-bold italic">{status}</span>)
        </>
      ) : null}
    </span>
  );
}

function familyTitle(members: MemberLike[]) {
  return (
    members.find((member) => member.status?.trim())?.name.trim() ||
    members.find((member) => member.name.trim())?.name.trim() ||
    "Group"
  );
}

/**
 * Legend identity for a pin.
 * Pin number is expected from the adjacent badge — this block only renders names.
 *
 * - 1 person: that name (+ status) as the title
 * - 2+ people: "{Name} Family" title + bulleted roster
 */
export function PersonLegendLine({
  members,
  layout = "list",
}: {
  /** @deprecated Pin is shown by the legend badge; kept optional for callers. */
  label?: string;
  members: MemberLike[];
  /** "list" for legend cards; "inline" joins names on one line. */
  layout?: "list" | "inline";
}) {
  const filled = members.filter((member) => member.name.trim());

  if (filled.length === 0) {
    return <span className="text-gray-500">(no names)</span>;
  }

  if (layout === "inline") {
    return (
      <>
        {filled.map((member, index) => (
          <span key={`${member.name}-${index}`}>
            {index > 0 ? ", " : null}
            <MemberNameLabel member={member} />
          </span>
        ))}
      </>
    );
  }

  // Single person: one clear title line — no empty pin text, no redundant list.
  if (filled.length === 1) {
    return (
      <p className="font-medium text-gray-900">
        <MemberNameLabel member={filled[0]} />
      </p>
    );
  }

  // Household: family title + full roster.
  return (
    <div>
      <p className="font-medium text-gray-900">
        {familyTitle(filled)} Family
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-gray-800 marker:text-gray-400">
        {filled.map((member, index) => (
          <li key={`${member.name}-${index}`} className="leading-snug">
            <MemberNameLabel member={member} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Plain-text fallback (e.g. titles/tooltips). Status stays in parentheses. */
export function formatMemberDisplayName(member: MemberLike): string {
  const name = member.name.trim();
  const status = member.status?.trim() ?? "";
  if (!name) return "";
  return status ? `${name} (${status})` : name;
}
