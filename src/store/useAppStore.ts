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
  addToGlossaryUnlocked,
} from '../firebase/db';
import type { Unsubscribe } from 'firebase/firestore';
import type { ThemeColorName } from '../utils/theme';
import { applyTheme } from '../utils/theme';
import { STOPS } from '../data/stops';

interface AppState {
  // ── Course ────────────────────────────────────────────────────────────
  courseId: string;
  setCourseId: (id: string) => void;

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
  saveResponse: (studentId: string, key: string, value: string | string[]) => Promise<void>;
  flagCheckpoint: (studentId: string, flag: boolean) => Promise<void>;
  raiseHand: (studentId: string, raised: boolean) => Promise<void>;
  markSessionComplete: (studentId: string, sessionId: string) => Promise<void>;
  advanceSession: (studentId: string, nextStop: number, nextSession: number) => Promise<void>;
  eraseSessionProgress: (studentId: string, stopId: number, sessionIndex: number) => Promise<void>;
  eraseAllProgress: (studentId: string) => Promise<void>;

  // ── Teacher actions ───────────────────────────────────────────────────
  unlockStop: (studentId: string, stopNumber: number) => Promise<void>;
  clearFlag: (studentId: string) => Promise<void>;
  updatePassword: (studentId: string, password: string) => Promise<void>;
  unlockGlossaryTerms: (studentId: string, termIds: string[]) => Promise<void>;

  // ── UI Preferences ──────────────────────────────────────────────────────
  themeColor: ThemeColorName;
  setThemeColor: (color: ThemeColorName) => void;
  themeMode: 'dark' | 'light';
  setThemeMode: (mode: 'dark' | 'light') => void;
  accessibilityMode: boolean;
  setAccessibilityMode: (on: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ── Course ────────────────────────────────────────────────────────────
  courseId: '10-2',

  setCourseId: (id) => set({ courseId: id }),

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
    const student = await getStudent(get().courseId, id);
    set({ currentStudent: student });
  },

  subscribeStudent: (id) =>
    subscribeToStudent(get().courseId, id, (student) => set({ currentStudent: student })),

  // ── All students ──────────────────────────────────────────────────────
  allStudents: [],

  loadAllStudents: async () => {
    const students = await getAllStudents(get().courseId);
    set({ allStudents: students });
  },

  subscribeAllStudents: () =>
    subscribeToAllStudents(get().courseId, (students) => {
      const sorted = [...students].sort((a, b) => a.displayName.localeCompare(b.displayName));
      set({ allStudents: sorted });
    }),

  // ── Session Unlocks ──────────────────────────────────────────────────
  unlocks: {},

  subscribeSessionUnlocks: () =>
    subscribeToSessionUnlocks(get().courseId, (records) => {
      const map: UnlockMap = {};
      records.forEach((r) => { map[r.sessionId] = r; });
      set({ unlocks: map });
    }),

  unlockSessions: async (sessionIds, scope, studentIds) => {
    await setSessionUnlocksBatch(get().courseId, sessionIds, 'teacher', scope, studentIds);
  },

  lockSessions: async (sessionIds) => {
    await deleteSessionUnlocksBatch(get().courseId, sessionIds);
  },

  // ── Student actions ───────────────────────────────────────────────────
  saveResponse: async (studentId, key, value) => {
    await updateStudent(get().courseId, studentId, { [`responses.${key}`]: value });
  },

  flagCheckpoint: async (studentId, flag) => {
    await updateStudent(get().courseId, studentId, { flaggedForCheckpoint: flag });
  },

  raiseHand: async (studentId, raised) => {
    await updateStudent(get().courseId, studentId, { raisedHand: raised });
  },

  markSessionComplete: async (studentId, sessionId) => {
    const student = get().currentStudent;
    if (!student) return;
    const already = student.completedSessions.includes(sessionId);
    if (already) return;
    const updated = [...student.completedSessions, sessionId];
    await updateStudent(get().courseId, studentId, { completedSessions: updated });
  },

  advanceSession: async (studentId, nextStop, nextSession) => {
    await updateStudent(get().courseId, studentId, {
      currentStop: nextStop,
      currentSession: nextSession,
    });
  },

  eraseSessionProgress: async (studentId, stopId, sessionIndex) => {
    const student = get().allStudents.find((s) => s.id === studentId)
      ?? get().currentStudent;
    if (!student) return;

    const stopObj = STOPS.find(s => s.id === stopId);
    if (!stopObj) return;
    const sessionObj = stopObj.sessions[sessionIndex];
    if (!sessionObj) return;

    const idsToDelete = new Set<string>();
    const collectIds = (obj: any) => {
      if (Array.isArray(obj)) {
        obj.forEach(collectIds);
      } else if (typeof obj === 'object' && obj !== null) {
        if (typeof obj.id === 'string') idsToDelete.add(obj.id);
        Object.values(obj).forEach(collectIds);
      }
    };
    collectIds(sessionObj.elements);

    const newResponses = { ...student.responses };
    Object.keys(newResponses).forEach((key) => {
      const matches = Array.from(idsToDelete).some(
        id => key === id || key.startsWith(id + '_') || key.startsWith(id + '-')
      );
      if (matches) delete newResponses[key];
    });

    const realSessionId = sessionObj.id;
    const newCompleted = student.completedSessions.filter(s => s !== realSessionId);

    const erasedVal = stopId * 1000 + sessionIndex;
    const currentVal = student.currentStop * 1000 + student.currentSession;
    let newStop = student.currentStop;
    let newSession = student.currentSession;
    if (erasedVal <= currentVal) {
      newStop = stopId;
      newSession = sessionIndex;
    }

    await updateStudent(get().courseId, studentId, {
      responses: newResponses,
      completedSessions: newCompleted,
      currentStop: newStop,
      currentSession: newSession,
    });
  },

  eraseAllProgress: async (studentId) => {
    const student = get().allStudents.find((s) => s.id === studentId);
    if (!student) return;
    await updateStudent(get().courseId, studentId, {
      responses: {},
      completedSessions: [],
      unlockedStops: [1],
      currentStop: 1,
      currentSession: 0,
      flaggedForCheckpoint: false,
      raisedHand: false,
      glossaryUnlocked: [],
    });
  },

  // ── Teacher actions ───────────────────────────────────────────────────
  unlockStop: async (studentId, stopNumber) => {
    const student = get().allStudents.find((s) => s.id === studentId);
    if (!student) return;
    if (student.unlockedStops.includes(stopNumber)) return;
    const updated = [...student.unlockedStops, stopNumber];
    await updateStudent(get().courseId, studentId, {
      unlockedStops: updated,
      flaggedForCheckpoint: false,
    });
  },

  clearFlag: async (studentId) => {
    await updateStudent(get().courseId, studentId, { flaggedForCheckpoint: false });
  },

  updatePassword: async (studentId, password) => {
    await updateStudent(get().courseId, studentId, { password });
  },

  unlockGlossaryTerms: async (studentId, termIds) => {
    await addToGlossaryUnlocked(get().courseId, studentId, termIds);
  },

  // ── UI Preferences ──────────────────────────────────────────────────────
  themeColor: (localStorage.getItem('themeColor') as ThemeColorName) || 'purple',
  setThemeColor: (color) => {
    localStorage.setItem('themeColor', color);
    set({ themeColor: color });
    applyTheme(color);
  },
  themeMode: (localStorage.getItem('themeMode') as 'dark' | 'light') || 'dark',
  setThemeMode: (mode) => {
    localStorage.setItem('themeMode', mode);
    set({ themeMode: mode });
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  },
  accessibilityMode: localStorage.getItem('accessibilityMode') === 'true',
  setAccessibilityMode: (on) => {
    localStorage.setItem('accessibilityMode', String(on));
    set({ accessibilityMode: on });
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

// ── Apply theme on load ──────────────────────────────────────────────────
applyTheme(useAppStore.getState().themeColor);
if (useAppStore.getState().themeMode === 'light') {
  document.documentElement.setAttribute('data-theme', 'light');
}
