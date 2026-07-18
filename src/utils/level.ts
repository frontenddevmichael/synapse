export function calculateLevel(xp: number): number {
  let level = 1;
  let xpNeeded = 0;
  while (xpNeeded + 100 * level <= xp) {
    xpNeeded += 100 * level;
    level++;
  }
  return level;
}

export function getXpProgress(xp: number): { current: number; max: number; percentage: number } {
  let level = 1;
  let xpUsed = 0;
  while (xpUsed + 100 * level <= xp) {
    xpUsed += 100 * level;
    level++;
  }
  const currentLevelXp = xp - xpUsed;
  const maxXp = 100 * level;
  return { current: currentLevelXp, max: maxXp, percentage: (currentLevelXp / maxXp) * 100 };
}
