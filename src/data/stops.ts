import rawData from './stops-content-v4.json';
import type { Stop, Session, StopElement } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawStop = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawSession = any;

function mapSession(raw: RawSession): Session {
  return {
    id: raw.id,
    title: raw.title,
    elements: (raw.elements ?? []) as StopElement[],
  };
}

function mapStop(raw: RawStop, index: number): Stop {
  return {
    id: index + 1,
    title: raw.title,
    outcomes: (raw.outcomes ?? []) as string[],
    sessions: (raw.sessions ?? []).map((s: RawSession) => mapSession(s)),
    checkpointRequired: raw.checkpoint_after !== false,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = rawData as any;
export const STOPS: Stop[] = (raw.checkpoints ?? raw.stops ?? []).map(mapStop);
