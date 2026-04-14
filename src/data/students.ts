import type { Student } from '../types';

export const STUDENT_ROSTER: Pick<Student, 'id' | 'displayName' | 'shortName' | 'password'>[] = [
  { id: 'carson-belcher',  displayName: 'Belcher, Carson',   shortName: 'Carson Belcher',   password: 'belcher1' },
  { id: 'zack-ceko',       displayName: 'Ceko, Zack',        shortName: 'Zack Ceko',        password: 'ceko1' },
  { id: 'emma-gallant',    displayName: 'Gallant, Emma',     shortName: 'Emma Gallant',     password: 'gallant1' },
  { id: 'bryce-gillett',   displayName: 'Gillett, Bryce',    shortName: 'Bryce Gillett',    password: 'gillett1' },
  { id: 'finn-greisinger', displayName: 'Greisinger, Finn',  shortName: 'Finn Greisinger',  password: 'greisinger1' },
  { id: 'harry-hargan',    displayName: 'Hargan, Harry',     shortName: 'Harry Hargan',     password: 'hargan1' },
  { id: 'carson-holstein', displayName: 'Holstein, Carson',  shortName: 'Carson Holstein',  password: 'holstein1' },
  { id: 'carter-otteson',  displayName: 'Otteson, Carter',   shortName: 'Carter Otteson',   password: 'otteson1' },
  { id: 'sloane-robinson', displayName: 'Robinson, Sloane',  shortName: 'Sloane Robinson',  password: 'robinson1' },
  { id: 'jayden-rollinmud',displayName: 'Rollinmud, Jayden', shortName: 'Jayden Rollinmud', password: 'rollinmud1' },
  { id: 'londyn-seward',   displayName: 'Seward, Londyn',    shortName: 'Londyn Seward',    password: 'seward1' },
];

export function buildDefaultStudent(
  roster: typeof STUDENT_ROSTER[0]
): Student {
  return {
    ...roster,
    currentStop: 1,
    currentSession: 1,
    flaggedForCheckpoint: false,
    unlockedStops: [1],
    completedSessions: [],
    glossaryUnlocked: [],
    responses: {},
    lastSeen: Date.now(),
  };
}
