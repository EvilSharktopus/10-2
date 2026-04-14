import { useState } from 'react';
import type { Student } from '../../types';
import { STOPS } from '../../data/stops';
import { useAppStore } from '../../store/useAppStore';
import { gradeStudent } from '../../utils/grading';

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
              {student.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)' }}>{student.displayName}</h3>
              <div className="text-xs text-muted">Checkpoint {student.currentStop} · {student.completedSessions.length} sessions done · Last seen {lastSeenStr}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {student.flaggedForCheckpoint && <span className="badge badge-amber">🚩 Checkpoint Requested</span>}
            {grade.teacherPending > 0 && <span className="badge badge-amber">📝 {grade.teacherPending} to review</span>}
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
            <div>
              {grade.byStop.map((stopGrade) => {
                const hasContent = stopGrade.sessions.some((sg) => sg.items.some((i) => i.hasResponse));
                if (!hasContent) return null;
                return (
                  <div key={stopGrade.stopId} style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid var(--accent)' }}>
                      <div style={{ background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20 }}>
                        CP {stopGrade.stopId}
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{stopGrade.stopTitle}</span>
                      {stopGrade.autoPossible > 0 && (
                        <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                          Auto: {Math.round((stopGrade.autoEarned / stopGrade.autoPossible) * 100)}%
                        </span>
                      )}
                      {stopGrade.teacherPending > 0 && <span className="badge badge-amber">📝 {stopGrade.teacherPending}</span>}
                    </div>
                    {stopGrade.sessions.map((sg) => {
                      const responded = sg.items.filter((i) => i.hasResponse);
                      if (responded.length === 0) return null;
                      return (
                        <div key={sg.sessionId} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {sg.sessionTitle}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {responded.map((item) => (
                              <ResponseCard
                                key={item.id}
                                item={item}
                                responses={student.responses ?? {}}
                                onScore={(key, val) => saveResponse(student.id, key, val)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {grade.totalResponses === 0 && (
                <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '32px 0' }}>No responses yet.</div>
              )}
            </div>
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

// ─── Response Card ─────────────────────────────────────────────────────────────
interface ResponseCardProps {
  item: import('../../utils/grading').GradeItem;
  responses: Record<string, string | string[]>;
  onScore: (key: string, value: string) => void;
}

function ResponseCard({ item, responses, onScore }: ResponseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [overriding, setOverriding] = useState(false);

  // Teacher score (for manually-graded items)
  const scoreKey = item.id + '_score';
  const existingScore = responses[scoreKey];
  const scored = existingScore !== undefined && existingScore !== '';
  const currentScore = scored ? Number(existingScore) : null;

  // Teacher override (for auto-graded items)
  const overrideKey = item.overrideKey;
  const existingOverride = overrideKey ? responses[overrideKey] : undefined;
  const isOverridden = existingOverride !== undefined && existingOverride !== '';
  const overrideScore = isOverridden ? Number(existingOverride) : null;

  const isLong = item.response.length > 120;
  const displayText = (!expanded && isLong) ? item.response.slice(0, 120) + '…' : item.response;

  const needsReview = item.gradedBy === 'teacher' && item.hasResponse && !scored;
  const isScored    = item.gradedBy === 'teacher' && scored;
  const isCorrect   = item.gradedBy === 'auto' && item.correct && !isOverridden;
  const isWrong     = item.gradedBy === 'auto' && item.hasResponse && !item.correct && !isOverridden;

  let borderColor = 'var(--border)';
  let bgColor = 'var(--surface)';
  if (needsReview)       { borderColor = 'var(--amber)';   bgColor = 'var(--amber-dim)'; }
  else if (isScored)     { borderColor = 'var(--success)';  bgColor = 'var(--success-dim)'; }
  else if (isOverridden) { borderColor = 'var(--accent)';   bgColor = 'var(--accent-dim)'; }
  else if (isCorrect)    { borderColor = 'var(--success)';  bgColor = 'var(--success-dim)'; }
  else if (isWrong)      { borderColor = 'var(--danger)';   bgColor = 'var(--danger-dim)'; }

  return (
    <div style={{ border: `1.5px solid ${borderColor}`, background: bgColor, borderRadius: 'var(--radius-sm)', padding: '10px 14px', transition: 'all 0.2s' }}>

      {/* Prompt + badge row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, fontStyle: 'italic' }}>{item.prompt}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          {needsReview   && <span className="badge badge-amber"   style={{ fontSize: '0.68rem' }}>📝 Unscored</span>}
          {isScored      && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ {currentScore}/{item.possible} pts</span>}
          {isOverridden  && <span className="badge badge-accent"  style={{ fontSize: '0.68rem' }}>✏️ Override: {overrideScore}/{item.possible} pts</span>}
          {isCorrect     && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ {item.earned}/{item.possible} pts</span>}
          {isWrong       && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>✗ {item.earned}/{item.possible} pts</span>}
        </div>
      </div>

      {/* Response text */}
      {item.hasResponse ? (
        <>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55, whiteSpace: 'pre-wrap', marginBottom: 8 }}>
            {displayText}
          </div>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-light)', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}>
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </>
      ) : (
        <div className="text-xs text-muted" style={{ marginBottom: 6 }}>No response yet</div>
      )}

      {/* Score button — teacher-graded */}
      {item.gradedBy === 'teacher' && item.hasResponse && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 6 }}>
          {!scoring ? (
            <button className={scored ? 'btn btn-ghost btn-sm' : 'btn btn-amber btn-sm'}
              style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => setScoring(true)}>
              {scored ? `Edit score (${currentScore}/${item.possible})` : 'Score this response'}
            </button>
          ) : (
            <ScorePicker possible={item.possible} current={currentScore}
              onPick={(pts) => { onScore(scoreKey, String(pts)); setScoring(false); }}
              onCancel={() => setScoring(false)} />
          )}
        </div>
      )}

      {/* Override button — auto-graded */}
      {item.gradedBy === 'auto' && item.hasResponse && overrideKey && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 6, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {!overriding ? (
            <>
              <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => setOverriding(true)}>
                {isOverridden ? `✏️ Edit override (${overrideScore}/${item.possible})` : '✏️ Override score'}
              </button>
              {isOverridden && (
                <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.68rem', padding: '3px 8px', color: 'var(--danger)' }}
                  onClick={() => onScore(overrideKey, '')}>
                  Clear override
                </button>
              )}
            </>
          ) : (
            <ScorePicker possible={item.possible} current={overrideScore}
              onPick={(pts) => { onScore(overrideKey, String(pts)); setOverriding(false); }}
              onCancel={() => setOverriding(false)} />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Score Picker ──────────────────────────────────────────────────────────────
function ScorePicker({ possible, current, onPick, onCancel }: {
  possible: number;
  current: number | null;
  onPick: (pts: number) => void;
  onCancel: () => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Score / {possible}:</span>
      {Array.from({ length: possible + 1 }, (_, i) => i).map((pts) => (
        <button key={pts} onClick={() => onPick(pts)} style={{
          width: 36, height: 36, borderRadius: 'var(--radius-sm)',
          border: `2px solid ${current === pts ? 'var(--accent)' : 'var(--border)'}`,
          background: current === pts ? 'var(--accent)' : 'var(--surface)',
          color: current === pts ? '#fff' : 'var(--text-primary)',
          fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.15s',
        }}>
          {pts}
        </button>
      ))}
      <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 10px' }} onClick={onCancel}>Cancel</button>
    </div>
  );
}
