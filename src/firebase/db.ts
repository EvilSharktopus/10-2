import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from './config';
import type { Student, ClassConfig, UnlockRecord } from '../types';

// ─── Students ────────────────────────────────────────────────────────────────
// ... (unchanged)
export async function getStudent(studentId: string): Promise<Student | null> {
  const ref = doc(db, 'students', studentId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as Student) : null;
}

export async function setStudent(student: Student): Promise<void> {
  const ref = doc(db, 'students', student.id);
  await setDoc(ref, student, { merge: true });
}

export async function updateStudent(
  studentId: string,
  data: Partial<Student>
): Promise<void> {
  const ref = doc(db, 'students', studentId);
  await updateDoc(ref, data as Record<string, unknown>);
}

export async function getAllStudents(): Promise<Student[]> {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs.map((d) => d.data() as Student);
}

export function subscribeToAllStudents(
  callback: (students: Student[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'students'), (snap) => {
    callback(snap.docs.map((d) => d.data() as Student));
  });
}

export function subscribeToStudent(
  studentId: string,
  callback: (student: Student | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, 'students', studentId), (snap) => {
    callback(snap.exists() ? (snap.data() as Student) : null);
  });
}

// ─── Class Config ────────────────────────────────────────────────────────────

export async function getClassConfig(): Promise<ClassConfig | null> {
  const snap = await getDoc(doc(db, 'config', 'class'));
  return snap.exists() ? (snap.data() as ClassConfig) : null;
}

export async function setClassConfig(config: ClassConfig): Promise<void> {
  await setDoc(doc(db, 'config', 'class'), config, { merge: true });
}

// ─── Session Unlocks ──────────────────────────────────────────────────────────

export function subscribeToSessionUnlocks(
  callback: (unlocks: UnlockRecord[]) => void
): Unsubscribe {
  return onSnapshot(collection(db, 'session_unlocks'), (snap) => {
    callback(snap.docs.map((d) => d.data() as UnlockRecord));
  });
}

export async function setSessionUnlocksBatch(
  sessionIds: string[],
  teacherUid: string,
  scope: 'all' | 'students',
  studentIds: string[]
): Promise<void> {
  if (sessionIds.length === 0) return;
  const batch = writeBatch(db);
  const now = Date.now();
  for (const sessionId of sessionIds) {
    const ref = doc(db, 'session_unlocks', sessionId);
    batch.set(ref, {
      sessionId,
      unlockedAt: now,
      unlockedBy: teacherUid,
      scope,
      studentIds: scope === 'students' ? studentIds : [],
    });
  }
  await batch.commit();
}

export async function deleteSessionUnlocksBatch(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  const batch = writeBatch(db);
  for (const sessionId of sessionIds) {
    batch.delete(doc(db, 'session_unlocks', sessionId));
  }
  await batch.commit();
}
