export const OPERATIONAL_STATUSES = ['New', 'Acknowledged', 'In Progress', 'Resolved'];
export const TERMINAL_CLASSIFICATIONS = ['Invalid', 'Duplicate'];
export const ALL_STATUSES = [...OPERATIONAL_STATUSES, ...TERMINAL_CLASSIFICATIONS];

export function isAllowedStatusTransition(current, next) {
  if (!ALL_STATUSES.includes(current) || !ALL_STATUSES.includes(next) || current === next) return false;
  if (TERMINAL_CLASSIFICATIONS.includes(current)) return false;
  if (TERMINAL_CLASSIFICATIONS.includes(next)) return true;
  const currentIndex = OPERATIONAL_STATUSES.indexOf(current);
  return OPERATIONAL_STATUSES[currentIndex + 1] === next;
}
