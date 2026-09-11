interface NamedMember { id: string; name: string }

/** Distinguishing name tokens, without assuming a given-name/family-name order. */
export function buildTeamMemberLabels(members: ReadonlyArray<NamedMember>): Record<string, string> {
  const names = members.map((member) => ({
    ...member,
    fullName: member.name.trim().replace(/\s+/gu, " ") || "?",
    tokens: member.name.trim().split(/\s+/u).filter(Boolean),
  }));
  const counts = new Map<string, number>();
  for (const member of names) {
    for (const token of new Set(member.tokens.map((token) => token.toLowerCase()))) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  const shorten = (value: string) => {
    const characters = Array.from(value);
    return characters.length <= 18 ? value : `${characters.slice(0, 17).join("")}…`;
  };
  const candidates = names.map((member) => ({
    id: member.id,
    label: shorten(member.tokens.find((token) => counts.get(token.toLowerCase()) === 1) ?? member.fullName),
  }));
  const labels: Record<string, string> = {};
  for (const candidate of candidates) {
    const collisions = candidates.filter((other) => other.label.toLowerCase() === candidate.label.toLowerCase())
      .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
    labels[candidate.id] = collisions.length === 1
      ? candidate.label
      : `${candidate.label} · ${collisions.findIndex((other) => other.id === candidate.id) + 1}`;
  }
  return labels;
}
