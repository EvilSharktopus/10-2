import { getClassConfig, setClassConfig, getStudent, setStudent } from '../firebase/db';
import { STUDENT_ROSTER, buildDefaultStudent } from '../data/students';

/**
 * Runs once on first app load.
 * Writes all 11 students and class config to Firestore if not already done.
 */
export async function seedIfNeeded(
  classCode: string,
  teacherPassword: string
): Promise<void> {
  const config = await getClassConfig();

  if (config?.initialized) return; // already seeded

  console.log('[Seed] First run detected — seeding Firestore...');

  // Write class config
  await setClassConfig({
    classCode,
    teacherPassword,
    initialized: true,
  });

  // Write all students
  for (const roster of STUDENT_ROSTER) {
    const existing = await getStudent(roster.id);
    if (!existing) {
      await setStudent(buildDefaultStudent(roster));
    }
  }

  console.log('[Seed] Done.');
}
