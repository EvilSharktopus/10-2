import type { UnlockMap } from '../types';

/**
 * Check if a specific session is unlocked for a given student.
 * Pass studentId = null to check "all" scope only (teacher view).
 */
export function isSessionUnlocked(
  unlocks: UnlockMap,
  sessionId: string,
  studentId: string | null = null
): boolean {
  const record = unlocks[sessionId];
  if (!record) return false;
  if (record.scope === 'all') return true;
  if (studentId && record.studentIds.includes(studentId)) return true;
  return false;
}
