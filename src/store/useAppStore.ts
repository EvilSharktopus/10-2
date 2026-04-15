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

  eraseSessionProgress: async (studentId, stopId, sessionIndex) => {
    const student = get().allStudents.find((s) => s.id === studentId);
    if (!student) return;

    // 1. Find all element IDs inside the erased session
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

    // 2. Filter responses
    const newResponses = { ...student.responses };
    Object.keys(newResponses).forEach((key) => {
      // Delete if key exact matches, or starts with id_ (for synthetic keys like table cells)
      const matches = Array.from(idsToDelete).some(id => key === id || key.startsWith(id + '_') || key.startsWith(id + '-'));
      if (matches) {
        delete newResponses[key];
      }
    });

    // 3. Remove from completedSessions
    const sessionIdentifier = `${stopId}-${sessionIndex}`;
    const newCompleted = student.completedSessions.filter(s => s !== sessionIdentifier);

    // 4. Optionally roll back current position if they are currently ahead of this session
    // We'll calculate a logical "progress value" to compare
    const erasedVal = stopId * 1000 + sessionIndex;
    const currentVal = student.currentStop * 1000 + student.currentSession;
    
    let newStop = student.currentStop;
    let newSession = student.currentSession;
    if (erasedVal <= currentVal) {
      newStop = stopId;
      newSession = sessionIndex; // snap them back to the start of this session
    }

    await updateStudent(studentId, {
      responses: newResponses,
      completedSessions: newCompleted,
      currentStop: newStop,
      currentSession: newSession
    });
  },

  eraseAllProgress: async (studentId) => {
    const student = get().allStudents.find((s) => s.id === studentId);
    if (!student) return;
    
    await updateStudent(studentId, {
      responses: {},
      completedSessions: [],
      unlockedStops: [1],
      currentStop: 1,
      currentSession: 0,
      flaggedForCheckpoint: false,
      glossaryUnlocked: [],
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

  unlockGlossaryTerms: async (studentId, termIds) => {
    // Uses Firestore arrayUnion — atomic, no race condition on rapid session transitions
    await addToGlossaryUnlocked(studentId, termIds);
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
