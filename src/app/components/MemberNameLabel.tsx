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

export function PersonLegendLine({
  label,
  members,
}: {
  label: string;
  members: MemberLike[];
}) {
  const pin = label.trim() || "•";
  const filled = members.filter((member) => member.name.trim());

  if (filled.length === 0) {
    return (
      <>
        {pin} — (no names)
      </>
    );
  }

  const memberNodes = filled.map((member, index) => (
    <span key={`${member.name}-${index}`}>
      {index > 0 ? ", " : null}
      <MemberNameLabel member={member} />
    </span>
  ));

  if (filled.length === 1) {
    return (
      <>
        {pin} - {memberNodes}
      </>
    );
  }

  const titleSource =
    filled.find((member) => member.status?.trim())?.name.trim() ||
    filled[0].name.trim() ||
    "Group";

  return (
    <>
      {pin} - {titleSource} Family: {memberNodes}
    </>
  );
}

/** Plain-text fallback (e.g. titles/tooltips). Status stays in parentheses. */
export function formatMemberDisplayName(member: MemberLike): string {
  const name = member.name.trim();
  const status = member.status?.trim() ?? "";
  if (!name) return "";
  return status ? `${name} (${status})` : name;
}
