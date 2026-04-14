import { useState } from 'react';
import type { Student } from '../../types';
import { STOPS } from '../../data/stops';
import { useAppStore } from '../../store/useAppStore';
import { gradeStudent } from '../../utils/grading';
import { ResponsesPanel } from '../shared/ResponsesPanel';

interface Props {
  student: Student;
  onClose: () => void;
}

type Tab = 'summary' | 'responses' | 'outcomes';

export function StudentDetailModal({ student, onClose }: Props) {
  const unlockStop = useAppStore((s) => s.unlockStop);
  const clearFlag = useAppStore((s) => s.clearFlag);
  const saveResponse = useAppStore((s) => s.saveResponse);
  const [activeTab, setActiveTab] = useState<Tab>('summary');

  const grade = gradeStudent(student.responses ?? {});
  const nextLockedStop = STOPS.find((s) => !student.unlockedStops.includes(s.id));

  const lastSeenStr = student.lastSeen
    ? new Date(student.lastSeen).toLocaleString()
    : 'Never';

  const pct = grade.autoAttemptedPossible > 0
    ? Math.round((grade.autoEarned / grade.autoAttemptedPossible) * 100)
    : 0;
  const pctColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ maxWidth: 720, width: '95vw' }}>

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '2px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-light)',
            }}>
              {(student.displayName ?? '').split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>{student.displayName}</h3>
              <div className="text-xs text-muted">Checkpoint {student.currentStop} · {student.completedSessions.length} sessions done · Last seen {lastSeenStr}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {student.flaggedForCheckpoint && <span className="badge badge-amber">🚩 Checkpoint Requested</span>}
            {grade.teacherPending > 0 && <span className="badge badge-amber">📝 {grade.teacherPending} to review</span>}
            {grade.disputeCount > 0 && <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}>✋ {grade.disputeCount} dispute{grade.disputeCount > 1 ? 's' : ''}</span>}
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Flag alert */}
        {student.flaggedForCheckpoint && (
          <div style={{ padding: '12px 20px', background: 'var(--amber-dim)', borderBottom: '1px solid var(--amber)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--amber)', fontWeight: 600 }}>🚩 Student is waiting for a checkpoint conversation.</div>
            <button className="btn btn-amber btn-sm" onClick={() => clearFlag(student.id)}>Clear Flag</button>
          </div>
        )}

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
          <div className="teacher-tabs" style={{ marginBottom: 0 }}>
            {([
              ['summary', 'Summary'],
              ['responses', `Responses${grade.teacherPending > 0 ? ` (${grade.teacherPending})` : ''}`],
              ['outcomes', 'Outcomes'],
            ] as [Tab, string][]).map(([id, label]) => (
              <button key={id} className={`teacher-tab${activeTab === id ? ' active' : ''}`} onClick={() => setActiveTab(id)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-body">

          {/* ── SUMMARY ── */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: '18px 20px' }}>
                <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Auto-Grade Score (attempted)</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: pctColor }}>{pct}%</span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{grade.autoEarned} / {grade.autoAttemptedPossible} pts attempted</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pctColor, borderRadius: 4, transition: 'width 0.5s' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  ['📝', 'Responses', grade.totalResponses.toString()],
                  ['📋', 'To Review', grade.teacherPending.toString()],
                  ['✅', 'Sessions Done', `${student.completedSessions.length}`],
                ].map(([icon, label, value]) => (
                  <div key={label as string} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{value}</div>
                    <div className="text-xs text-muted mt-1">{label}</div>
                  </div>
                ))}
              </div>

              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="text-xs text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Checkpoint Progress</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STOPS.map((s) => {
                    const unlocked = student.unlockedStops.includes(s.id);
                    return (
                      <div key={s.id} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                        background: unlocked ? 'var(--success-dim)' : 'var(--surface)',
                        border: `1.5px solid ${unlocked ? 'var(--success)' : 'var(--border)'}`,
                        color: unlocked ? 'var(--success)' : 'var(--text-muted)',
                      }}>
                        {unlocked ? '✓' : '🔒'} CP {s.id}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="text-xs text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {nextLockedStop && (
                    <button className="btn btn-success btn-sm" onClick={() => unlockStop(student.id, nextLockedStop.id)}>
                      🔓 Unlock Checkpoint {nextLockedStop.id}
                    </button>
                  )}
                  {!nextLockedStop && <span className="badge badge-success">✓ All checkpoints unlocked</span>}
                  {student.flaggedForCheckpoint && (
                    <button className="btn btn-amber btn-sm" onClick={() => clearFlag(student.id)}>Clear Checkpoint Flag</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── RESPONSES ── */}
          {activeTab === 'responses' && (
            <ResponsesPanel
              grade={grade}
              responses={student.responses ?? {}}
              onScore={(key, val) => saveResponse(student.id, key, val)}
            />
          )}

          {/* ── OUTCOMES ── */}
          {activeTab === 'outcomes' && (
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Alberta curriculum outcome breakdown. Auto-% reflects machine-graded questions only (based on attempted).
              </div>
              {Object.keys(grade.byOutcome).length === 0 && (
                <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '32px 0' }}>No data yet.</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(grade.byOutcome).sort(([a], [b]) => a.localeCompare(b)).map(([code, g]) => {
                  const pct2 = g.possible > 0 ? Math.round((g.earned / g.possible) * 100) : null;
                  const c = pct2 == null ? 'var(--text-muted)' : pct2 >= 75 ? 'var(--success)' : pct2 >= 50 ? 'var(--amber)' : 'var(--danger)';
                  return (
                    <div key={code} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-light)', minWidth: 48 }}>{code}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden', marginBottom: 4 }}>
                          <div style={{ height: '100%', width: `${pct2 ?? 0}%`, background: c, borderRadius: 4, transition: 'width 0.5s' }} />
                        </div>
                        <div className="text-xs text-muted">
                          Auto: {g.earned}/{g.possible} pts{g.pending > 0 ? ` · ${g.pending} teacher-graded pending` : ''}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: c, minWidth: 48, textAlign: 'right' }}>
                        {pct2 !== null ? `${pct2}%` : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}


