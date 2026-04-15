import { getClassConfig, setClassConfig, getStudent, setStudent } from '../firebase/db';
import { STUDENT_ROSTER, buildDefaultStudent } from '../data/students';

// NOTE: First teacher login after any Firebase path change will trigger re-seed
// under the new namespace. Old flat-path data (students/, session_unlocks/) is
// no longer read and can be manually deleted from the Firestore console.

/**
 * Runs once per course on first app load.
 * Writes all students and class config to Firestore under courses/{courseId}/
 * if not already seeded for this course.
 */
export async function seedIfNeeded(
  courseId: string,
  classCode: string,
  teacherPassword: string,
): Promise<void> {
  const config = await getClassConfig(courseId);

  if (config?.initialized) return; // already seeded for this course

  console.log(`[Seed] First run for course "${courseId}" — seeding Firestore...`);

  await setClassConfig(courseId, {
    classCode,
    teacherPassword,
    initialized: true,
  });

  for (const roster of STUDENT_ROSTER) {
    const existing = await getStudent(courseId, roster.id);
    if (!existing) {
      await setStudent(courseId, buildDefaultStudent(roster));
    }
  }

  console.log(`[Seed] Done for course "${courseId}".`);
}
