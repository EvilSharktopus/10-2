import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { LoginPage } from './pages/LoginPage';
import { StudentPage } from './pages/StudentPage';
import { TeacherPage } from './pages/TeacherPage';
import { seedIfNeeded } from './utils/seed';

const CLASS_CODE = import.meta.env.VITE_CLASS_CODE ?? 'socials102';
const TEACHER_CODE = import.meta.env.VITE_TEACHER_CODE ?? 'teacher102';

// ─── Per-course app shell ────────────────────────────────────────────────────
function CourseApp() {
  const { courseId } = useParams<{ courseId: string }>();
  const auth = useAppStore((s) => s.auth);
  const setCourseId = useAppStore((s) => s.setCourseId);
  const [seeded, setSeeded] = useState(false);

  // Set courseId in store and trigger seed whenever the URL param changes
  useEffect(() => {
    if (!courseId) return;
    setCourseId(courseId);

    const timeout = setTimeout(() => {
      console.warn('[Seed] Firebase took too long — proceeding anyway.');
      setSeeded(true);
    }, 6000);

    seedIfNeeded(courseId, CLASS_CODE, TEACHER_CODE)
      .then(() => {
        clearTimeout(timeout);
        setSeeded(true);
      })
      .catch((err) => {
        console.error('[Seed] Error:', err);
        clearTimeout(timeout);
        setSeeded(true);
      });

    return () => clearTimeout(timeout);
  }, [courseId, setCourseId]);

  if (!seeded) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Connecting…</span>
      </div>
    );
  }

  if (!auth.studentId && !auth.isTeacher) {
    return <LoginPage />;
  }

  if (auth.isTeacher) {
    return <TeacherPage />;
  }

  return <StudentPage studentId={auth.studentId!} />;
}

// ─── Root router ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/workbooks/10-2" replace />} />
      <Route path="/workbooks/:courseId" element={<CourseApp />} />
      {/* Catch-all: redirect unknown paths to default course */}
      <Route path="*" element={<Navigate to="/workbooks/10-2" replace />} />
    </Routes>
  );
}
