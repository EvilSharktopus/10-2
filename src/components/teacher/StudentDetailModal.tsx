import { useState } from 'react';
import type { Student } from '../../types';
import { STOPS } from '../../data/stops';
import { useAppStore } from '../../store/useAppStore';
import { gradeStudent } from '../../utils/grading';
import { ResponsesPanel } from '../shared/ResponsesPanel';

interface Props {
  student: Student;
  onClose: () => void;
  initialTab?: Tab;
}

type Tab = 'summary' | 'responses' | 'outcomes' | 'override';

export function StudentDetailModal({ student, onClose, initialTab = 'summary' }: Props) {
  const unlockStop = useAppStore((s) => s.unlockStop);
  const clearFlag = useAppStore((s) => s.clearFlag);
  const saveResponse = useAppStore((s) => s.saveResponse);
  const eraseSessionProgress = useAppStore((s) => s.eraseSessionProgress);
  const eraseAllProgress = useAppStore((s) => s.eraseAllProgress);
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [expandedOverride, setExpandedOverride] = useState<number | null>(null);

  const grade = gradeStudent(student.responses ?? {});

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
              ['override', 'Override'],
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
                      <button
                        key={s.id}
                        title={unlocked ? `Checkpoint ${s.id} unlocked` : `Click to unlock Checkpoint ${s.id}`}
                        disabled={unlocked}
                        onClick={() => unlockStop(student.id, s.id)}
                        style={{
                          padding: '5px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
                          background: unlocked ? 'var(--success-dim)' : 'var(--surface)',
                          border: `1.5px solid ${unlocked ? 'var(--success)' : 'var(--border)'}`,
                          color: unlocked ? 'var(--success)' : 'var(--text-muted)',
                          cursor: unlocked ? 'default' : 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { if (!unlocked) { e.currentTarget.style.borderColor = 'var(--success)'; e.currentTarget.style.color = 'var(--success)'; e.currentTarget.style.background = 'var(--success-dim)'; }}}
                        onMouseLeave={(e) => { if (!unlocked) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'var(--surface)'; }}}
                      >
                        {unlocked ? '✓' : '🔒'} CP {s.id}
                      </button>
                    );
                  })}
                </div>
                <div className="text-xs text-muted mt-2">Click any locked checkpoint to unlock it.</div>
              </div>

              <div className="card" style={{ padding: '14px 16px' }}>
                <div className="text-xs text-muted mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Actions</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STOPS.filter((s) => !student.unlockedStops.includes(s.id)).length === 0 ? (
                    <span className="badge badge-success">✓ All checkpoints unlocked</span>
                  ) : (
                    STOPS.filter((s) => !student.unlockedStops.includes(s.id)).map((s) => (
                      <button key={s.id} className="btn btn-success btn-sm" onClick={() => unlockStop(student.id, s.id)}>
                        🔓 Unlock CP {s.id}
                      </button>
                    ))
                  )}
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

          {/* ── OVERRIDE ── */}
          {activeTab === 'override' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="text-xs text-muted mb-2">
                Erasing progress permanently deletes a student's responses for a specific session and resets their completion status. They will be pushed back to this session. This cannot be undone.
              </div>
              {STOPS.map((s) => {
                const isExpanded = expandedOverride === s.id;
                return (
                  <div key={s.id} className="card" style={{ padding: '14px 18px' }}>
                    <div 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => setExpandedOverride(isExpanded ? null : s.id)}
                    >
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-light)' }}>
                        Checkpoint {s.id}
                      </div>
                      <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
                        {isExpanded ? '▼' : '►'}
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        {s.sessions.map((session, idx) => {
                          const isCompleted = student.completedSessions.includes(`${s.id}-${idx}`);
                          const isActive = student.currentStop === s.id && student.currentSession === idx;
                          return (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6, border: '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{session.title || `Session ${idx + 1}`}</div>
                                <div className="text-xs text-muted">
                                  {isActive ? 'Currently Active' : isCompleted ? 'Completed' : 'Not Reached'}
                                </div>
                              </div>
                              <button 
                                className="btn btn-sm" 
                                style={{ background: 'var(--danger-dim)', color: 'var(--danger)', border: '1px solid var(--danger)', fontSize: '0.75rem', padding: '4px 8px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you SURE you want to erase progress for Checkpoint ${s.id} - ${session.title || `Session ${idx + 1}`}?\n\nThis will permanently delete all typed answers and tracking for this session.`)) {
                                    eraseSessionProgress(student.id, s.id, idx);
                                    window.alert('Progress erased successfully.');
                                  }
                                }}
                              >
                                Erase Progress
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Clear stale disputes */}
              {Object.keys(student.responses ?? {}).some((k) => k.endsWith('_dispute') && student.responses?.[k] === 'pending') && (
                <div style={{ marginTop: 8, padding: '14px 18px', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 6 }}>
                    ✋ Stale Dispute Detected
                  </div>
                  <div className="text-xs text-muted mb-3">
                    This student has a pending dispute that can't be addressed through the normal Responses tab (likely from a question that was removed or changed). Click below to dismiss all unresolved disputes.
                  </div>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}
                    onClick={() => {
                      const resp = student.responses ?? {};
                      Object.keys(resp).forEach((k) => {
                        if (k.endsWith('_dispute') && resp[k] === 'pending') {
                          saveResponse(student.id, k, 'dismissed');
                        }
                      });
                    }}
                  >
                    Dismiss All Pending Disputes
                  </button>
                </div>
              )}

              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px dashed var(--danger)' }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>Nuclear Option</div>
                <div className="text-xs text-muted mb-3">
                  This will completely reset the student's account to a brand new state.
                </div>
                <button 
                  className="btn" 
                  style={{ background: 'var(--danger)', color: '#fff', width: '100%', fontWeight: 700 }}
                  onClick={() => {
                    const prompt = window.prompt("Type CONFIRM to securely erase this student's ENTIRE workbook history:");
                    if (prompt === "CONFIRM") {
                      eraseAllProgress(student.id);
                      window.alert("All progress has been permanently wiped.");
                    } else if (prompt !== null) {
                      window.alert("Confirmation failed. Progress was not erased.");
                    }
                  }}
                >
                  Erase ALL Progress
                </button>
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


