import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { StudentCard } from '../components/teacher/StudentCard';
import { StudentDetailModal } from '../components/teacher/StudentDetailModal';
import { PasswordTable } from '../components/teacher/PasswordTable';
import { UnlockSessionModal } from '../components/teacher/UnlockSessionModal';
import { STOPS } from '../data/stops';
import type { Student } from '../types';

export function TeacherPage() {
  const subscribeAllStudents = useAppStore((s) => s.subscribeAllStudents);
  const subscribeSessionUnlocks = useAppStore((s) => s.subscribeSessionUnlocks);
  const students = useAppStore((s) => s.allStudents);
  const logout = useAppStore((s) => s.logout);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'passwords'>('overview');
  const [search, setSearch] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  useEffect(() => {
    const unsubStudents = subscribeAllStudents();
    const unsubUnlocks = subscribeSessionUnlocks();
    return () => {
      unsubStudents();
      unsubUnlocks();
    };
  }, [subscribeAllStudents, subscribeSessionUnlocks]);

  // Keep modal in sync with live data
  useEffect(() => {
    if (selectedStudent) {
      const updated = students.find((s) => s.id === selectedStudent.id);
      if (updated) setSelectedStudent(updated);
    }
  }, [students]);

  const flaggedCount = students.filter((s) => s.flaggedForCheckpoint).length;

  const filtered = students.filter(
    (s) =>
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.shortName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="teacher-layout">
      <div className="teacher-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
              Social Studies 10-2 — Teacher Dashboard
            </div>
            <div className="text-xs text-muted mt-1">
              {students.length} students
              {flaggedCount > 0 && (
                <span className="badge badge-amber" style={{ marginLeft: 8 }}>
                  🚩 {flaggedCount} checkpoint{flaggedCount > 1 ? 's' : ''} waiting
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="teacher-tabs">
            <button
              className={`teacher-tab${activeTab === 'overview' ? ' active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button
              className={`teacher-tab${activeTab === 'passwords' ? ' active' : ''}`}
              onClick={() => setActiveTab('passwords')}
            >
              🔑 Passwords
            </button>
          </div>
          <button
            className="btn btn-primary btn-sm"
            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setShowUnlockModal(true)}
          >
            🔓 Unlock Sessions
          </button>
          <button className="btn btn-ghost btn-sm" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>

      <div className="teacher-main">
        {activeTab === 'overview' && (
          <>
            {/* Flagged students banner */}
            {flaggedCount > 0 && (
              <div
                style={{
                  background: 'var(--amber-dim)',
                  border: '1.5px solid var(--amber)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 18px',
                  marginBottom: 20,
                  maxWidth: 1200,
                  margin: '0 auto 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>🚩</span>
                <div>
                  <strong style={{ color: 'var(--amber)' }}>
                    {flaggedCount} student{flaggedCount > 1 ? 's' : ''} requesting a checkpoint
                  </strong>
                  <div className="text-xs text-muted mt-1">
                    {students.filter((s) => s.flaggedForCheckpoint).map((s) => s.shortName).join(', ')}
                  </div>
                </div>
              </div>
            )}


            {/* Search */}
            <div style={{ maxWidth: 1200, margin: '0 auto 20px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Search students…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ maxWidth: 320 }}
              />
            </div>

            {students.length === 0 ? (
              <div className="loading-screen" style={{ minHeight: 200 }}>
                <div className="spinner" />
                <span>Loading students…</span>
              </div>
            ) : (
              <div className="teacher-grid">
                {/* Show flagged first */}
                {[...filtered]
                  .sort((a, b) => (b.flaggedForCheckpoint ? 1 : 0) - (a.flaggedForCheckpoint ? 1 : 0))
                  .map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onClick={() => setSelectedStudent(student)}
                    />
                  ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'passwords' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <div className="card">
              <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>
                🔑 Student Passwords
              </h3>
              <p className="text-muted text-sm mb-3">
                All passwords are visible here. You can edit them inline.
                Students cannot see this page.
              </p>
              {students.length === 0 ? (
                <div className="text-muted text-sm">Loading…</div>
              ) : (
                <PasswordTable students={students} />
              )}
            </div>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {showUnlockModal && (
        <UnlockSessionModal
          checkpoints={STOPS}
          students={students}
          onClose={() => setShowUnlockModal(false)}
        />
      )}
    </div>
  );
}
