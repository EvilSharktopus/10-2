import { getClassConfig, setClassConfig, getStudent, setStudent } from '../firebase/db';
import { COURSE_ROSTERS, buildDefaultStudent } from '../data/students';

// ─── Per-course config ─────────────────────────────────────────────────────────
// classCodes  — all valid codes students can enter for this course
// teacherCode — teacher dashboard password
//
// Add new class codes here when adding new groups to an existing course.
export const COURSE_CONFIGS: Record<string, { classCodes: string[]; teacherCode: string }> = {
  '10-2': { classCodes: ['socials102', 'socials101'], teacherCode: 'teacher102' },
};

/**
 * Runs once per course on first app load.
 * Writes all students (across all class codes) and class config to Firestore
 * under courses/{courseId}/ if not already seeded for this course.
 */
export async function seedIfNeeded(courseId: string): Promise<void> {
  const config = await getClassConfig(courseId);
  if (config?.initialized) {
    // Course already seeded — but still check for any new students
    // (e.g. Mason added after initial seed of 10-2).
    const roster = COURSE_ROSTERS[courseId] ?? COURSE_ROSTERS['10-2'];
    for (const entry of roster) {
      const existing = await getStudent(courseId, entry.id);
      if (!existing) {
        console.log(`[Seed] New student "${entry.id}" — seeding into "${courseId}"...`);
        await setStudent(courseId, buildDefaultStudent(entry));
      }
    }
    return;
  }

  const courseConfig = COURSE_CONFIGS[courseId] ?? COURSE_CONFIGS['10-2'];
  const roster = COURSE_ROSTERS[courseId] ?? COURSE_ROSTERS['10-2'];

  console.log(`[Seed] First run for course "${courseId}" — seeding Firestore...`);

  await setClassConfig(courseId, {
    classCode: courseConfig.classCodes[0], // primary code stored in config
    teacherPassword: courseConfig.teacherCode,
    initialized: true,
  });

  for (const entry of roster) {
    const existing = await getStudent(courseId, entry.id);
    if (!existing) {
      await setStudent(courseId, buildDefaultStudent(entry));
    }
  }

  console.log(`[Seed] Done for course "${courseId}".`);
}
