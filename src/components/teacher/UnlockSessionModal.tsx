import { useState, useMemo } from 'react';
import type { Student, Stop } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import './UnlockSessionModal.css';

interface Props {
  checkpoints: Stop[];
  students: Student[];
  onClose: () => void;
}

export function UnlockSessionModal({ checkpoints, students, onClose }: Props) {
  const unlocks = useAppStore((s) => s.unlocks);
  const unlockSessionsAction = useAppStore((s) => s.unlockSessions);
  const lockSessionsAction = useAppStore((s) => s.lockSessions);

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<'all' | 'students'>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // ── Session selection ──────────────────────────────────────────────────────

  function toggleSession(sessionId: string) {
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      next.has(sessionId) ? next.delete(sessionId) : next.add(sessionId);
      return next;
    });
  }

  function toggleCheckpoint(checkpoint: Stop) {
    const ids = checkpoint.sessions.map((s) => s.id);
    const allSelected = ids.every((id) => selectedSessions.has(id));
    setSelectedSessions((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  // ── Student selection ──────────────────────────────────────────────────────

  function toggleStudent(studentId: string) {
    setSelectedStudents((prev) => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  async function handleUnlock() {
    if (selectedSessions.size === 0) return;
    if (scope === 'students' && selectedStudents.size === 0) return;

    setSubmitting(true);
    try {
      await unlockSessionsAction(
        Array.from(selectedSessions),
        scope,
        scope === 'students' ? Array.from(selectedStudents) : []
      );
      setDone(true);
    } catch (err) {
      console.error('Unlock failed:', err);
      alert('Something went wrong. Check the console.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Summary line ───────────────────────────────────────────────────────────

  const summaryText = useMemo(() => {
    const n = selectedSessions.size;
    if (n === 0) return 'No sessions selected';
    const sessionWord = n === 1 ? 'session' : 'sessions';
    if (scope === 'all') return `${n} ${sessionWord} → all students`;
    const s = selectedStudents.size;
    if (s === 0) return `${n} ${sessionWord} → select students below`;
    return `${n} ${sessionWord} → ${s} student${s === 1 ? '' : 's'}`;
  }, [selectedSessions, scope, selectedStudents]);

  return (
    <div className="usm-backdrop" onClick={onClose}>
      <div className="usm-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="usm-header">
          <div className="usm-header-left">
            <span className="usm-icon">🔓</span>
            <div>
              <h2 className="usm-title">Unlock Sessions</h2>
              <p className="usm-subtitle">
                {step === 1 ? 'Select sessions to unlock' : 'Choose who gets access'}
              </p>
            </div>
          </div>
          <button className="usm-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* ── Step indicators ── */}
        <div className="usm-steps">
          <div className={`usm-step ${step === 1 ? 'active' : 'done'}`}>
            <span className="usm-step-num">{step === 1 ? '1' : '✓'}</span>
            <span>Sessions</span>
          </div>
          <div className="usm-step-divider" />
          <div className={`usm-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
            <span className="usm-step-num">2</span>
            <span>Students</span>
          </div>
        </div>

        {/* ── Done state ── */}
        {done ? (
          <div className="usm-done">
            <span className="usm-done-icon">✅</span>
            <h3>Sessions unlocked</h3>
            <p>{summaryText}</p>
            <p className="usm-done-sub">Students will see the change immediately.</p>
            <button className="usm-btn-primary" onClick={onClose}>Done</button>
          </div>
        ) : step === 1 ? (
          // ── STEP 1 — Session picker ──────────────────────────────────────
          <>
            <div className="usm-body">
              {selectedSessions.size > 0 && (
                <div className="usm-selection-bar">
                  {summaryText}
                  <button className="usm-clear" onClick={() => setSelectedSessions(new Set())}>
                    Clear all
                  </button>
                </div>
              )}

              {checkpoints.map((checkpoint) => {
                const checkIds = checkpoint.sessions.map((s) => s.id);
                const allChecked = checkIds.every((id) => selectedSessions.has(id));
                const someChecked = checkIds.some((id) => selectedSessions.has(id));

                return (
                  <div key={checkpoint.id} className="usm-checkpoint">
                    <label className="usm-checkpoint-header">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => {
                          if (el) el.indeterminate = someChecked && !allChecked;
                        }}
                        onChange={() => toggleCheckpoint(checkpoint)}
                        className="usm-checkbox"
                      />
                      <span className="usm-checkpoint-title">Checkpoint {checkpoint.id}: {checkpoint.title.split('—')[1]?.trim() ?? checkpoint.title}</span>
                      <span className="usm-checkpoint-count">
                        {checkIds.filter((id) => selectedSessions.has(id)).length}/{checkpoint.sessions.length}
                      </span>
                    </label>

                    <div className="usm-sessions">
                      {checkpoint.sessions.map((session) => {
                        // Check if it's currently unlocked for "all" explicitly
                        const record = unlocks[session.id];
                        const alreadyUnlocked = record && record.scope === 'all';
                        const isSelected = selectedSessions.has(session.id);

                        return (
                          <label
                            key={session.id}
                            className={`usm-session-row ${isSelected ? 'selected' : ''} ${alreadyUnlocked ? 'already-unlocked' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSession(session.id)}
                              className="usm-checkbox"
                            />
                            <span className="usm-session-title">{session.title.split('—')[1]?.trim() ?? session.title}</span>
                            <span className="usm-session-badges">
                              {session.special_unlock && (
                                <span className="usm-badge usm-badge-special">Film</span>
                              )}
                              {alreadyUnlocked && (
                                <span className="usm-badge usm-badge-unlocked">
                                  Already unlocked
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 24, padding: '12px 16px', background: 'var(--danger-dim)', borderRadius: 8, border: '1px dashed var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 2 }}>Reset Class Access</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lock all sessions immediately.</div>
                </div>
                <button 
                  className="btn" 
                  style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap' }}
                  onClick={async () => {
                    const prompt = window.prompt("Type CONFIRM to lock all sessions for the entire class:");
                    if (prompt === "CONFIRM") {
                      try {
                        setSubmitting(true);
                        // Gather literally every session ID in the workbook to strip locks
                        const allSessionIds: string[] = [];
                        checkpoints.forEach(cp => cp.sessions.forEach(s => allSessionIds.push(s.id)));
                        
                        await lockSessionsAction(allSessionIds);
                        window.alert("All sessions have been successfully locked!");
                        onClose();
                      } catch (err) {
                        alert("Failed to lock sessions.");
                      } finally {
                        setSubmitting(false);
                      }
                    }
                  }}
                >
                  🔒 Lock Sessions For All Students
                </button>
              </div>
            </div>

            <div className="usm-footer">
              <button className="usm-btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="usm-btn-primary"
                disabled={selectedSessions.size === 0}
                onClick={() => setStep(2)}
              >
                Next: Choose Students →
              </button>
            </div>
          </>
        ) : (
          // ── STEP 2 — Student scope picker ────────────────────────────────
          <>
            <div className="usm-body">
              <div className="usm-scope-cards">
                <label className={`usm-scope-card ${scope === 'all' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                  />
                  <div className="usm-scope-card-content">
                    <span className="usm-scope-icon">👥</span>
                    <div>
                      <strong>Unlock for all students</strong>
                      <p>Everyone in the class gets access immediately.</p>
                    </div>
                  </div>
                </label>

                <label className={`usm-scope-card ${scope === 'students' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="scope"
                    value="students"
                    checked={scope === 'students'}
                    onChange={() => setScope('students')}
                  />
                  <div className="usm-scope-card-content">
                    <span className="usm-scope-icon">🎯</span>
                    <div>
                      <strong>Specific students only</strong>
                      <p>Choose which students get access.</p>
                    </div>
                  </div>
                </label>
              </div>

              {scope === 'students' && (
                <div className="usm-student-list">
                  <div className="usm-student-list-header">
                    <span>Select students</span>
                    <button
                      className="usm-clear"
                      onClick={() =>
                        setSelectedStudents(
                          selectedStudents.size === students.length
                            ? new Set()
                            : new Set(students.map((s) => s.id))
                        )
                      }
                    >
                      {selectedStudents.size === students.length ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>
                  {students.map((student) => (
                    <label
                      key={student.id}
                      className={`usm-student-row ${selectedStudents.has(student.id) ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="usm-checkbox"
                      />
                      <span>{student.displayName}</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="usm-summary">
                <span className="usm-summary-icon">📋</span>
                {summaryText}
              </div>
            </div>

            <div className="usm-footer">
              <button className="usm-btn-ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="usm-btn-primary"
                disabled={
                  submitting ||
                  selectedSessions.size === 0 ||
                  (scope === 'students' && selectedStudents.size === 0)
                }
                onClick={handleUnlock}
              >
                {submitting ? 'Unlocking…' : `🔓 Unlock ${selectedSessions.size} ${selectedSessions.size === 1 ? 'session' : 'sessions'}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
