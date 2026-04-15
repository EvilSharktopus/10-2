import { useState } from 'react';
import type { GradeItem, StudentGrade } from '../../utils/grading';

interface ResponsesPanelProps {
  grade: StudentGrade;
  responses: Record<string, string | string[]>;
  onScore: (key: string, value: string) => void;
  isStudentView?: boolean;
}

export function ResponsesPanel({ grade, responses, onScore, isStudentView }: ResponsesPanelProps) {
  const stopsWithContent = grade.byStop.filter((sg) =>
    sg.sessions.some((s) => s.items.some((i) => i.hasResponse))
  );

  const [activeStopId, setActiveStopId] = useState<number>(
    stopsWithContent[0]?.stopId ?? 1
  );
  // Track which sessions are open; default all open
  const [openSessions, setOpenSessions] = useState<Record<string, boolean>>({});

  const toggleSession = (sid: string) =>
    setOpenSessions((prev) => ({ ...prev, [sid]: !(prev[sid] ?? true) }));

  const isOpen = (sid: string) => openSessions[sid] ?? true;

  if (stopsWithContent.length === 0) {
    return <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '32px 0' }}>No responses yet.</div>;
  }

  const activeStop = grade.byStop.find((s) => s.stopId === activeStopId);

  return (
    <div>
      {/* ── CP tab strip ── */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20,
        borderBottom: '1px solid var(--border)', paddingBottom: 12,
      }}>
        {stopsWithContent.map((sg) => {
          const isActive = sg.stopId === activeStopId;
          const hasPending = !isStudentView && sg.teacherPending > 0;
          const hasDispute = !isStudentView && sg.sessions.some((s) =>
            s.items.some((i) => i.disputeStatus === 'pending' && !i.correct)
          );
          return (
            <button
              key={sg.stopId}
              onClick={() => setActiveStopId(sg.stopId)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.8rem',
                background: isActive ? 'var(--accent)' : 'var(--surface)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
              }}
            >
              CP {sg.stopId}
              {hasPending && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--amber)', display: 'inline-block' }} />}
              {hasDispute && <span style={{ fontSize: '0.7rem' }}>✋</span>}
            </button>
          );
        })}
      </div>

      {/* ── Active CP: sessions as collapsible drawers ── */}
      {activeStop && (
        <div>
          {/* CP header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: '0.75rem', padding: '3px 10px', borderRadius: 20 }}>
              CP {activeStop.stopId}
            </div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{activeStop.stopTitle}</span>
            {activeStop.autoPossible > 0 && (
              <span className="badge badge-accent" style={{ marginLeft: 'auto' }}>
                Auto: {Math.round((activeStop.autoEarned / activeStop.autoPossible) * 100)}%
              </span>
            )}
            {!isStudentView && activeStop.teacherPending > 0 && (
              <span className="badge badge-amber">📝 {activeStop.teacherPending}</span>
            )}
          </div>

          {/* Session drawers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeStop.sessions.map((sg) => {
              const responded = sg.items.filter((i) => i.hasResponse);
              if (responded.length === 0) return null;
              const open = isOpen(sg.sessionId);
              const pendingCount = responded.filter((i) => i.gradedBy === 'teacher' && responses[i.id + '_score'] === undefined).length;
              const disputeCount = responded.filter((i) => i.disputeStatus === 'pending' && !i.correct).length;

              return (
                <div key={sg.sessionId} style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden',
                }}>
                  {/* Drawer header — clickable */}
                  <button
                    onClick={() => toggleSession(sg.sessionId)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', background: open ? 'var(--surface-raised, var(--surface))' : 'var(--surface)',
                      border: 'none', cursor: 'pointer', textAlign: 'left',
                      borderBottom: open ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <span style={{
                      fontSize: '0.75rem', color: 'var(--text-muted)', transition: 'transform 0.2s',
                      transform: open ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block',
                    }}>▶</span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {sg.sessionTitle}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                      {responded.length} response{responded.length !== 1 ? 's' : ''}
                    </span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                      {!isStudentView && pendingCount > 0 && <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>📝 {pendingCount}</span>}
                      {!isStudentView && disputeCount > 0 && <span className="badge" style={{ fontSize: '0.65rem', background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}>✋ {disputeCount}</span>}
                    </div>
                  </button>

                  {/* Drawer body */}
                  {open && (
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {responded.map((item) => (
                        <ResponseCard
                          key={item.id}
                          item={item}
                          responses={responses}
                          onScore={onScore}
                          isStudentView={isStudentView}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Response Card ─────────────────────────────────────────────────────────────
interface ResponseCardProps {
  item: GradeItem;
  responses: Record<string, string | string[]>;
  onScore: (key: string, value: string) => void;
  isStudentView?: boolean;
}

function ResponseCard({ item, responses, onScore, isStudentView }: ResponseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [writingFeedback, setWritingFeedback] = useState(false);
  const [draftFeedback, setDraftFeedback] = useState('');
  
  const [draftDispute, setDraftDispute] = useState('');
  const [isDisputing, setIsDisputing] = useState(false);

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
  const isDisputed  = item.gradedBy === 'auto' && item.disputeStatus === 'pending' && !item.correct && !isOverridden;

  let borderColor = 'var(--border)';
  let bgColor = 'var(--surface)';
  if (needsReview)       { borderColor = 'var(--amber)';   bgColor = 'var(--amber-dim)'; }
  else if (isScored)     { borderColor = 'var(--success)';  bgColor = 'var(--success-dim)'; }
  else if (isOverridden) { borderColor = 'var(--accent)';   bgColor = 'var(--accent-dim)'; }
  else if (isCorrect)    { borderColor = 'var(--success)';  bgColor = 'var(--success-dim)'; }
  else if (isDisputed)   { borderColor = 'var(--accent)';   bgColor = 'var(--accent-dim)'; }
  else if (isWrong)      { borderColor = 'var(--danger)';   bgColor = 'var(--danger-dim)'; }

  const handleDisputeSubmit = () => {
    if (!draftDispute.trim() || !onScore) return;
    onScore(item.id + '_dispute_note', draftDispute);
    onScore(item.id + '_dispute', 'pending');
    setIsDisputing(false);
  };

  const handleTeacherFeedbackSubmit = () => {
    if (!onScore) return;
    onScore(item.id + '_feedback', draftFeedback);
    setWritingFeedback(false);
  };

  return (
    <div style={{ border: `1.5px solid ${borderColor}`, background: bgColor, borderRadius: 'var(--radius-sm)', padding: '10px 14px', transition: 'all 0.2s' }}>

      {/* Prompt + badge row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, fontStyle: 'italic' }}>{item.prompt}</div>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 }}>
          {needsReview   && (isStudentView ? <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>Waiting for Mr. McRae</span> : <span className="badge badge-amber" style={{ fontSize: '0.68rem' }}>📝 Unscored</span>)}
          {isScored      && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ {currentScore}/{item.possible} pts</span>}
          {isOverridden  && <span className="badge badge-accent"  style={{ fontSize: '0.68rem' }}>✏️ Override: {overrideScore}/{item.possible} pts</span>}
          {isDisputed    && <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)' }}>{isStudentView ? '⏳ Under review' : '✋ Student disputes'}</span>}
          {!isDisputed && item.disputeStatus === 'dismissed' && <span className="badge" style={{ fontSize: '0.68rem', background: 'var(--surface-raised)', color: 'var(--text-muted)' }}>❌ Dispute Dismissed</span>}
          {isCorrect     && <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>✓ {item.earned}/{item.possible} pts</span>}
          {isWrong && !isDisputed && <span style={{ fontSize: '0.68rem', color: 'var(--danger)', fontWeight: 700 }}>✗ {item.earned}/{item.possible} pts</span>}
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

      {/* Feedback Display (Student and Teacher modes after set) */}
      {item.feedback && !writingFeedback && (
        <div style={{ background: 'var(--surface-raised)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginTop: 8, borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-light)', fontWeight: 700, marginBottom: 4 }}>Teacher Feedback</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{item.feedback}</div>
          {!isStudentView && (
            <button className="btn btn-ghost btn-sm" style={{ padding: '0', fontSize: '0.7rem', marginTop: 6 }} onClick={() => { setDraftFeedback(item.feedback!); setWritingFeedback(true); }}>
              Edit Feedback
            </button>
          )}
        </div>
      )}

      {/* Teacher Actions: Score + Feedback for manually-graded items */}
      {!isStudentView && item.gradedBy === 'teacher' && item.hasResponse && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 6 }}>
          {!scoring ? (
            <div style={{ display: 'flex', gap: 8 }}>
               <button className={scored ? 'btn btn-ghost btn-sm' : 'btn btn-amber btn-sm'}
                 style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => setScoring(true)}>
                 {scored ? `Edit score (${currentScore}/${item.possible})` : 'Score this response'}
               </button>
               {!writingFeedback && !item.feedback && (
                 <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '4px 12px' }} onClick={() => { setDraftFeedback(item.feedback ?? ''); setWritingFeedback(true); }}>
                   📝 Add feedback
                 </button>
               )}
            </div>
          ) : (
            <ScorePicker possible={item.possible} current={currentScore}
              onPick={(pts) => { onScore(scoreKey, String(pts)); setScoring(false); }}
              onCancel={() => setScoring(false)} />
          )}

          {writingFeedback && (
             <div style={{ marginTop: 8 }}>
               <textarea className="form-input form-textarea" rows={2} placeholder="Write feedback here..." value={draftFeedback} onChange={(e) => setDraftFeedback(e.target.value)} style={{ fontSize: '0.8rem', minHeight: 60 }} />
               <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                 <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }} onClick={handleTeacherFeedbackSubmit}>Save Feedback</button>
                 <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setWritingFeedback(false)}>Cancel</button>
               </div>
             </div>
          )}
        </div>
      )}

      {/* Student Action: Inline Dispute */}
      {isStudentView && isWrong && !isDisputed && item.disputeStatus !== 'dismissed' && item.disputeStatus !== 'accepted' && (
         <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 6 }}>
           {!isDisputing ? (
             <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem', padding: '3px 8px', color: 'var(--accent-light)', border: '1px solid var(--accent)' }} onClick={() => setIsDisputing(true)}>
               ✋ Dispute Score
             </button>
           ) : (
             <div>
               <textarea className="form-input form-textarea" rows={2} placeholder="Why do you think your answer should be accepted?"
                 value={draftDispute} onChange={e => setDraftDispute(e.target.value)} style={{ fontSize: '0.8rem', minHeight: 60 }} />
               <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                 <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }} onClick={handleDisputeSubmit} disabled={!draftDispute.trim()}>Submit Dispute</button>
                 <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setIsDisputing(false)}>Cancel</button>
               </div>
             </div>
           )}
         </div>
      )}

      {/* Teacher Actions: Override / Resolve Dispute for auto-graded items */}
      {!isStudentView && item.gradedBy === 'auto' && item.hasResponse && overrideKey && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 8, marginTop: 6 }}>
          {isDisputed && (
            <div style={{ marginBottom: 10, background: 'var(--surface-raised)', padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-light)', fontWeight: 700, marginBottom: 4 }}>Student's Dispute Note:</div>
              {item.disputeNote ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: 8 }}>"{item.disputeNote}"</div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: 8 }}>No note provided.</div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-success btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => {
                   onScore(overrideKey, String(item.possible));
                   onScore(item.id + '_dispute', 'accepted');
                }}>
                   Accept (Override to {item.possible} pts)
                </button>
                <button className="btn btn-danger btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => onScore(item.id + '_dispute', 'dismissed')}>
                   Dismiss
                </button>
              </div>
            </div>
          )}

          {!isDisputed && (
             <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
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
