import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { LoginPage } from './pages/LoginPage';
import { StudentPage } from './pages/StudentPage';
import { TeacherPage } from './pages/TeacherPage';
import { LandingPage } from './pages/LandingPage';
import { PrintSessionPage } from './pages/PrintSessionPage';
import { seedIfNeeded } from './utils/seed';

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

    seedIfNeeded(courseId)
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/workbooks/:courseId/print/:sessionId" element={<PrintSessionPage />} />
      <Route path="/workbooks/:courseId" element={<CourseApp />} />
      {/* Catch-all: redirect unknown paths to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
