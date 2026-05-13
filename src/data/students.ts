import type { Student } from '../types';

// ─── Per-student roster entry ─────────────────────────────────────────────────
export interface RosterEntry {
  id: string;
  displayName: string;
  shortName: string;
  password: string;
  /** If set, only these stop numbers will be shown to this student. */
  allowedStops?: number[];
}

// ─── Full Firestore roster per courseId ───────────────────────────────────────
// All students across ALL class codes for a given course live here.
// Each courseId maps to one Firestore namespace (courses/{courseId}/students/).
export const COURSE_ROSTERS: Record<string, RosterEntry[]> = {

  '10-2': [
    // ── socials102 ────────────────────────────────────────────────────────
    { id: 'carson-belcher',   displayName: 'Belcher, Carson',    shortName: 'Carson Belcher',    password: 'belcher1' },
    { id: 'zack-ceko',        displayName: 'Ceko, Zack',         shortName: 'Zack Ceko',         password: 'ceko1' },
    { id: 'emma-gallant',     displayName: 'Gallant, Emma',      shortName: 'Emma Gallant',      password: 'gallant1' },
    { id: 'bryce-gillett',    displayName: 'Gillett, Bryce',     shortName: 'Bryce Gillett',     password: 'gillett1' },
    { id: 'finn-greisinger',  displayName: 'Greisinger, Finn',   shortName: 'Finn Greisinger',   password: 'greisinger1' },
    { id: 'harry-hargan',     displayName: 'Hargan, Harry',      shortName: 'Harry Hargan',      password: 'hargan1' },
    { id: 'carson-holstein',  displayName: 'Holstein, Carson',   shortName: 'Carson Holstein',   password: 'holstein1' },
    { id: 'carter-otteson',   displayName: 'Otteson, Carter',    shortName: 'Carter Otteson',    password: 'otteson1' },
    { id: 'sloane-robinson',  displayName: 'Robinson, Sloane',   shortName: 'Sloane Robinson',   password: 'robinson1' },
    { id: 'jayden-rollinmud', displayName: 'Rollinmud, Jayden',  shortName: 'Jayden Rollinmud',  password: 'rollinmud1' },
    { id: 'londyn-seward',    displayName: 'Seward, Londyn',     shortName: 'Londyn Seward',     password: 'seward1' },
    // ── socials101 ────────────────────────────────────────────────────────
    // Mason uses the same /workbooks/10-2 URL but enters class code 'socials101'.
    // His allowedStops restricts which checkpoints he can see.
    {
      id: 'mason-barrie',
      displayName: 'Barrie, Mason',
      shortName: 'Mason Barrie',
      password: 'barrie1',
      allowedStops: [2, 3, 5, 6],
    },
  ],

};

// ─── Class-code → student ID list ─────────────────────────────────────────────
// Controls which names appear in the login grid for each class code.
// Students NOT listed for a given code won't be shown (even if they exist in
// the Firestore roster above).
export const CLASS_CODE_ROSTERS: Record<string, string[]> = {
  'socials102': [
    'carson-belcher', 'zack-ceko', 'emma-gallant', 'bryce-gillett',
    'finn-greisinger', 'harry-hargan', 'carson-holstein', 'carter-otteson',
    'sloane-robinson', 'jayden-rollinmud', 'londyn-seward',
  ],
  'socials101': ['mason-barrie'],
};

// ─── Backward-compat alias ────────────────────────────────────────────────────
/** @deprecated Use COURSE_ROSTERS['10-2'] for new code. */
export const STUDENT_ROSTER = COURSE_ROSTERS['10-2'];

// ─── Default student factory ──────────────────────────────────────────────────
export function buildDefaultStudent(roster: RosterEntry): Student {
  return {
    id: roster.id,
    displayName: roster.displayName,
    shortName: roster.shortName,
    password: roster.password,
    currentStop: 1,
    currentSession: 0,
    flaggedForCheckpoint: false,
    unlockedStops: [1],
    ...(roster.allowedStops ? { allowedStops: roster.allowedStops } : {}),
    completedSessions: [],
    glossaryUnlocked: [],
    responses: {},
    lastSeen: Date.now(),
  };
}
