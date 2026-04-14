import { create } from 'zustand';
import type { Student, AuthSession, UnlockMap } from '../types';
import {
  getStudent,
  updateStudent,
  getAllStudents,
  subscribeToAllStudents,
  subscribeToStudent,
  subscribeToSessionUnlocks,
  setSessionUnlocksBatch,
  deleteSessionUnlocksBatch,
} from '../firebase/db';
import type { Unsubscribe } from 'firebase/firestore';

interface AppState {
  // ── Auth ─────────────────────────────────────────────────────────────
  auth: AuthSession;
  setAuth: (auth: AuthSession) => void;
  logout: () => void;

  // ── Current student (for student view) ───────────────────────────────
  currentStudent: Student | null;
  loadStudent: (id: string) => Promise<void>;
  subscribeStudent: (id: string) => Unsubscribe;

  // ── All students (for teacher view) ──────────────────────────────────
  allStudents: Student[];
  loadAllStudents: () => Promise<void>;
  subscribeAllStudents: () => Unsubscribe;

  // ── Session Unlocks ──────────────────────────────────────────────────
  unlocks: UnlockMap;
  subscribeSessionUnlocks: () => Unsubscribe;
  unlockSessions: (sessionIds: string[], scope: 'all' | 'students', studentIds: string[]) => Promise<void>;
  lockSessions: (sessionIds: string[]) => Promise<void>;

  // ── Student actions ───────────────────────────────────────────────────
  saveResponse: (
    studentId: string,
    key: string,
    value: string | string[]
  ) => Promise<void>;
  flagCheckpoint: (studentId: string, flag: boolean) => Promise<void>;
  markSessionComplete: (studentId: string, sessionId: string) => Promise<void>;
  advanceSession: (studentId: string, nextStop: number, nextSession: number) => Promise<void>;

  // ── Teacher actions ───────────────────────────────────────────────────
  unlockStop: (studentId: string, stopNumber: number) => Promise<void>;
  clearFlag: (studentId: string) => Promise<void>;
  updatePassword: (studentId: string, password: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Auth ─────────────────────────────────────────────────────────────
  auth: { studentId: null, isTeacher: false },

  setAuth: (auth) => {
    set({ auth });
    sessionStorage.setItem('auth', JSON.stringify(auth));
  },

  logout: () => {
    sessionStorage.removeItem('auth');
    set({ auth: { studentId: null, isTeacher: false }, currentStudent: null });
  },

  // ── Current student ───────────────────────────────────────────────────
  currentStudent: null,

  loadStudent: async (id) => {
    const student = await getStudent(id);
    set({ currentStudent: student });
  },

  subscribeStudent: (id) =>
    subscribeToStudent(id, (student) => set({ currentStudent: student })),

  // ── All students ──────────────────────────────────────────────────────
  allStudents: [],

  loadAllStudents: async () => {
    const students = await getAllStudents();
    set({ allStudents: students });
  },

  subscribeAllStudents: () =>
    subscribeToAllStudents((students) => {
      // Sort by displayName
      const sorted = [...students].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      );
      set({ allStudents: sorted });
    }),

  // ── Session Unlocks ──────────────────────────────────────────────────
  unlocks: {},

  subscribeSessionUnlocks: () =>
    subscribeToSessionUnlocks((records) => {
      const map: UnlockMap = {};
      records.forEach((r) => { map[r.sessionId] = r; });
      set({ unlocks: map });
    }),

  unlockSessions: async (sessionIds, scope, studentIds) => {
    const teacherUid = 'teacher'; // Since we use shared generic teacher auth locally
    await setSessionUnlocksBatch(sessionIds, teacherUid, scope, studentIds);
  },

  lockSessions: async (sessionIds) => {
    await deleteSessionUnlocksBatch(sessionIds);
  },

  // ── Student actions ───────────────────────────────────────────────────
  saveResponse: async (studentId, key, value) => {
    await updateStudent(studentId, { [`responses.${key}`]: value });
  },

  flagCheckpoint: async (studentId, flag) => {
    await updateStudent(studentId, { flaggedForCheckpoint: flag });
  },

  markSessionComplete: async (studentId, sessionId) => {
    const student = get().currentStudent;
    if (!student) return;
    const already = student.completedSessions.includes(sessionId);
    if (already) return;
    const updated = [...student.completedSessions, sessionId];
    await updateStudent(studentId, { completedSessions: updated });
  },

  advanceSession: async (studentId, nextStop, nextSession) => {
    await updateStudent(studentId, {
      currentStop: nextStop,
      currentSession: nextSession,
    });
  },

  // ── Teacher actions ───────────────────────────────────────────────────
  unlockStop: async (studentId, stopNumber) => {
    const student = get().allStudents.find((s) => s.id === studentId);
    if (!student) return;
    const alreadyUnlocked = student.unlockedStops.includes(stopNumber);
    if (alreadyUnlocked) return;
    const updated = [...student.unlockedStops, stopNumber];
    await updateStudent(studentId, {
      unlockedStops: updated,
      flaggedForCheckpoint: false,
    });
  },

  clearFlag: async (studentId) => {
    await updateStudent(studentId, { flaggedForCheckpoint: false });
  },

  updatePassword: async (studentId, password) => {
    await updateStudent(studentId, { password });
  },
}));

// ── Restore auth from sessionStorage on page load ─────────────────────────
const stored = sessionStorage.getItem('auth');
if (stored) {
  try {
    useAppStore.getState().setAuth(JSON.parse(stored));
  } catch {
    sessionStorage.removeItem('auth');
  }
}
