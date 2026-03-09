/**
 * Static lookup for team display names (used in admin booking assignment).
 * Cleaner names come from profiles (real data).
 */
export const TEAM_ID_TO_NAME: Record<string, string> = {
  t1: "Team A — Precision Squad",
  t2: "Team B — Speed Force",
  t3: "Team C — Elite Clean",
};

export function getCleanerDisplayName(cleanerId: string | null, teamId: string | null): string {
  if (cleanerId) return "Assigned";
  if (teamId && TEAM_ID_TO_NAME[teamId]) return TEAM_ID_TO_NAME[teamId];
  return teamId ? "Team assigned" : "Unassigned";
}
