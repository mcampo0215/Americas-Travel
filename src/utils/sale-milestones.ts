export type SaleMilestoneState = {
  dateKey: string;
  achieved: number[];
  pending: number[];
};

export function recordSaleMilestone(
  state: SaleMilestoneState,
  dateKey: string,
  totalSold: number,
): SaleMilestoneState {
  const current = state.dateKey === dateKey
    ? state
    : { dateKey, achieved: [], pending: [] };
  const isMilestone = totalSold === 10 || totalSold === 25 || (totalSold >= 50 && totalSold % 50 === 0);

  if (!isMilestone || current.achieved.includes(totalSold)) {
    return current;
  }

  return {
    dateKey,
    achieved: [...current.achieved, totalSold],
    pending: [...current.pending, totalSold],
  };
}