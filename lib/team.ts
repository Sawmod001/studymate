// Team profile (NAIC submission item #6). Fill in real names/roles/bios
// before submission — this page renders them publicly.
export interface Member {
  name: string;
  role: string;
  responsibility: string;
  bio: string;
}

export const TEAM: Member[] = [
  {
    name: "TODO: Full name",
    role: "TODO: e.g. Team Lead / Frontend",
    responsibility: "TODO: what this person built",
    bio: "TODO: 1-2 line bio",
  },
  {
    name: "TODO: Full name",
    role: "TODO: e.g. Backend / N-ATLAS integration",
    responsibility: "TODO: what this person built",
    bio: "TODO: 1-2 line bio",
  },
];

export function teamComplete(): boolean {
  return TEAM.length > 0 && TEAM.every((m) => !m.name.startsWith("TODO"));
}
