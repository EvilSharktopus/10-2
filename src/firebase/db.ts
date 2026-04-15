import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
  arrayUnion,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { Student, ClassConfig, UnlockRecord } from '../types';

// ─── Path helpers ─────────────────────────────────────────────────────────────
const studentsCol  = (courseId: string) => collection(db, 'courses', courseId, 'students');
const studentDoc   = (courseId: string, studentId: string) => doc(db, 'courses', courseId, 'students', studentId);
const unlocksCol   = (courseId: string) => collection(db, 'courses', courseId, 'session_unlocks');
const unlockDoc    = (courseId: string, sessionId: string) => doc(db, 'courses', courseId, 'session_unlocks', sessionId);
const configDoc    = (courseId: string) => doc(db, 'courses', courseId, 'config', 'class');

// ─── Students ─────────────────────────────────────────────────────────────────

export async function getStudent(courseId: string, studentId: string): Promise<Student | null> {
  const snap = await getDoc(studentDoc(courseId, studentId));
  return snap.exists() ? (snap.data() as Student) : null;
}

export async function setStudent(courseId: string, student: Student): Promise<void> {
  await setDoc(studentDoc(courseId, student.id), student, { merge: true });
}

export async function updateStudent(
  courseId: string,
  studentId: string,
  data: Partial<Student>
): Promise<void> {
  await updateDoc(studentDoc(courseId, studentId), data as Record<string, unknown>);
}

/** Atomically appends termIds to glossaryUnlocked — no read, no race condition. */
export async function addToGlossaryUnlocked(
  courseId: string,
  studentId: string,
  termIds: string[]
): Promise<void> {
  if (termIds.length === 0) return;
  await updateDoc(studentDoc(courseId, studentId), { glossaryUnlocked: arrayUnion(...termIds) });
}

export async function getAllStudents(courseId: string): Promise<Student[]> {
  const snap = await getDocs(studentsCol(courseId));
  return snap.docs.map((d) => d.data() as Student);
}

export function subscribeToAllStudents(
  courseId: string,
  callback: (students: Student[]) => void
): Unsubscribe {
  return onSnapshot(studentsCol(courseId), (snap) => {
    callback(snap.docs.map((d) => d.data() as Student));
  });
}

export function subscribeToStudent(
  courseId: string,
  studentId: string,
  callback: (student: Student | null) => void
): Unsubscribe {
  return onSnapshot(studentDoc(courseId, studentId), (snap) => {
    callback(snap.exists() ? (snap.data() as Student) : null);
  });
}

// ─── Class Config ─────────────────────────────────────────────────────────────

export async function getClassConfig(courseId: string): Promise<ClassConfig | null> {
  const snap = await getDoc(configDoc(courseId));
  return snap.exists() ? (snap.data() as ClassConfig) : null;
}

export async function setClassConfig(courseId: string, config: ClassConfig): Promise<void> {
  await setDoc(configDoc(courseId), config, { merge: true });
}

// ─── Session Unlocks ──────────────────────────────────────────────────────────

export function subscribeToSessionUnlocks(
  courseId: string,
  callback: (unlocks: UnlockRecord[]) => void
): Unsubscribe {
  return onSnapshot(unlocksCol(courseId), (snap) => {
    callback(snap.docs.map((d) => d.data() as UnlockRecord));
  });
}

export async function setSessionUnlocksBatch(
  courseId: string,
  sessionIds: string[],
  teacherUid: string,
  scope: 'all' | 'students',
  studentIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;
  const batch = writeBatch(db);
  const now = Date.now();
  for (const sessionId of sessionIds) {
    batch.set(unlockDoc(courseId, sessionId), {
      sessionId,
      unlockedAt: now,
      unlockedBy: teacherUid,
      scope,
      studentIds: scope === 'students' ? studentIds : [],
    });
  }
  await batch.commit();
}

export async function deleteSessionUnlocksBatch(
  courseId: string,
  sessionIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;
  const batch = writeBatch(db);
  for (const sessionId of sessionIds) {
    batch.delete(unlockDoc(courseId, sessionId));
  }
  await batch.commit();
}
