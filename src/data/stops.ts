import rawDataV4 from './stops-content-v4.json';
import type { Stop, Session, StopElement } from '../types';

// ─── Course content map ───────────────────────────────────────────────────────
// To add a second course: import its JSON and add an entry here.
// No other code changes needed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const COURSE_CONTENT: Record<string, any> = {
  '10-2': rawDataV4,
};

// ─── Mappers ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(raw: any): Session {
  return {
    id: raw.id,
    title: raw.title,
    elements: (raw.elements ?? []) as StopElement[],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStop(raw: any, index: number): Stop {
  return {
    id: index + 1,
    title: raw.title,
    outcomes: (raw.outcomes ?? []) as string[],
    sessions: (raw.sessions ?? []).map(mapSession),
    checkpointRequired: raw.checkpoint_after !== false,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get parsed Stop[] for a given courseId. Falls back to '10-2' if unknown. */
export function getStops(courseId: string): Stop[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = (COURSE_CONTENT[courseId] ?? COURSE_CONTENT['10-2']) as any;
  return (raw.checkpoints ?? raw.stops ?? []).map(mapStop);
}

/**
 * Static export for utilities that don't have courseId context
 * (grading, erase, override modals).  Safe while there's only one course.
 * Update to getStops(activeCourseId) when a second course ships.
 */
export const STOPS: Stop[] = getStops('10-2');
