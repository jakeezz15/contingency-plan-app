export type RoleDefinition = {
  label: string;
  emoji: string;
  color: string;
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
  { label: "Team Lead", emoji: "★", color: "#f59e0b" },
  { label: "Backup Contact", emoji: "📞", color: "#8b5cf6" },
  { label: "Driver", emoji: "🚗", color: "#2563eb" },
  { label: "Medical", emoji: "🏥", color: "#dc2626" },
  { label: "Elderly", emoji: "🧓", color: "#ea580c" },
  { label: "Family", emoji: "👨‍👩‍👧", color: "#16a34a" },
  { label: "Staff", emoji: "💼", color: "#475569" },
  { label: "Other", emoji: "👤", color: "#6b7280" },
];

export const DEFAULT_ROLE: RoleDefinition = {
  label: "",
  emoji: "📍",
  color: "#3b82f6",
};

export const MEETING_POINT_LEGEND = {
  label: "Meeting Point",
  emoji: "🚩",
  color: "#dc2626",
};

export const ROLE_OPTIONS = ROLE_DEFINITIONS.map((role) => role.label);

const ROLE_ALIASES: Record<string, string> = {
  "Medical Team": "Medical",
};

export function getRoleDefinition(role: string): RoleDefinition {
  const normalizedRole = ROLE_ALIASES[role] ?? role;

  return (
    ROLE_DEFINITIONS.find((definition) => definition.label === normalizedRole) ??
    DEFAULT_ROLE
  );
}

export function formatRoleOption(definition: RoleDefinition) {
  return `${definition.emoji} ${definition.label}`;
}
