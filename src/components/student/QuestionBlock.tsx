import { useState } from 'react';
import type { VideoQuestion } from '../../types';

interface Props {
  question: VideoQuestion;
  index: number;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  // For persisting lock state across navigation
  allResponses?: Record<string, string | string[]>;
  onSaveFlag?: (key: string, value: string) => void;
  disabled?: boolean;
  hidePrompt?: boolean;
}

const noPaste = (e: React.ClipboardEvent) => e.preventDefault();
const LOCK_SUFFIX = '_locked';

function normAnswer(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
}

export function QuestionBlock({ question: q, index, value, onChange, allResponses, onSaveFlag, disabled, hidePrompt }: Props) {
  const strVal = Array.isArray(value) ? value.join(',') : (value ?? '');

  // Persist lock via Firestore so navigating away doesn't reset
  const lockKey = q.id + LOCK_SUFFIX;
  const isPersistedLocked = allResponses?.[lockKey] === '1';

  const lock = () => onSaveFlag?.(lockKey, '1');

  const disputeKey = q.id + '_dispute';
  const disputeNoteKey = q.id + '_dispute_note';
  const disputeStatus = allResponses?.[disputeKey] as string | undefined;
  
  const [isDisputing, setIsDisputing] = useState(false);
  const [draftDispute, setDraftDispute] = useState('');

  const submitDispute = () => {
    if (!draftDispute.trim() || !onSaveFlag) return;
    onSaveFlag(disputeNoteKey, draftDispute);
    onSaveFlag(disputeKey, 'pending');
    setIsDisputing(false);
  };


  // ── True / False ──────────────────────────────────────────────────────────
  if (q.question_type === 'true_false') {
    const selected = strVal;
    const correct = q.correct_answer;
    // Locked as soon as they answer
    const isLocked = isPersistedLocked || !!selected;
    const showFeedback = isLocked && selected !== '';
    const isAnswerCorrect = (selected === 'True') === correct;


    const handleSelect = (v: string) => {
      if (disabled || isLocked) return;
      onChange(v);
      lock();
    };

    return (
      <div className="question-block">
        <div className="question-number">Q{index + 1} · True or False · {q.points} pt{q.points !== 1 ? 's' : ''}</div>
        <div className="question-prompt">{q.text}</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {['True', 'False'].map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = (opt === 'True') === correct;
            let bg = 'var(--surface)';
            let border = 'var(--border)';
            let color = 'var(--text-secondary)';
            if (isSelected && showFeedback) {
              bg = isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)';
              border = isCorrect ? 'var(--success)' : 'var(--danger)';
              color = isCorrect ? 'var(--success)' : 'var(--danger)';
            } else if (isSelected) {
              bg = 'var(--accent-dim)';
              border = 'var(--accent)';
              color = 'var(--accent-light)';
            }
            return (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                disabled={disabled || isLocked}
                style={{
                  padding: '10px 28px',
                  borderRadius: 'var(--radius-sm)',
                  background: bg,
                  border: `1.5px solid ${border}`,
                  color,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: (disabled || isLocked) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: (disabled || (isLocked && !isSelected)) ? 0.5 : 1,
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {showFeedback && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: isAnswerCorrect ? 'var(--success)' : 'var(--danger)' }}>
              {isAnswerCorrect ? '✓ Correct!' : `✗ The answer is ${correct ? 'True' : 'False'}.`}
            </span>
            {!isAnswerCorrect && !disabled && (
              disputeStatus === 'pending' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 600 }}>⏳ Under review</span>
              ) : disputeStatus === 'accepted' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✅ Dispute accepted</span>
              ) : disputeStatus === 'dismissed' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>❌ Dispute dismissed</span>
              ) : !isDisputing ? (
                <button
                  onClick={() => setIsDisputing(true)}
                  title="Raise a dispute — ask your teacher to review this"
                  style={{
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent-light)',
                    borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '0.75rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  ✋ Dispute
                </button>
              ) : (
                <div style={{ flexBasis: '100%', marginTop: 8 }}>
                  <textarea className="form-input form-textarea" rows={2} 
                    placeholder="Why do you think your answer should be accepted?"
                    value={draftDispute} onChange={e => setDraftDispute(e.target.value)} 
                    style={{ fontSize: '0.8rem', minHeight: 60 }} 
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }} onClick={submitDispute} disabled={!draftDispute.trim()}>Submit Dispute</button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setIsDisputing(false)}>Cancel</button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
        {isLocked && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>Answer locked.</div>}
      </div>
    );
  }

  // ── Fill in the Blank ─────────────────────────────────────────────────────
  if (q.question_type === 'fill_blank' && q.blanks) {
    const parts = q.text.split('___');
    const storedBlanks: string[] = strVal ? strVal.split('||') : parts.slice(0, -1).map(() => '');
    const [localBlanks, setLocalBlanks] = useState<string[]>(storedBlanks);

    // Locked after "Check Answers" — persisted
    const [localChecked, setLocalChecked] = useState(false);
    const isLocked = isPersistedLocked || localChecked;

    const checkResults: boolean[] | null = isLocked
      ? (q.blanks ?? []).map((b, i) => b.accepted_answers.some((a) => normAnswer(a) === normAnswer(localBlanks[i] ?? '')))
      : null;

    const handleBlankChange = (i: number, v: string) => {
      const next = [...localBlanks];
      next[i] = v;
      setLocalBlanks(next);
      onChange(next.join('||'));
    };

    const handleCheck = () => {
      setLocalChecked(true);
      lock();
    };

    const allFilled = localBlanks.every((b) => b.trim() !== '');
    const allCorrect = checkResults && checkResults.every(Boolean);


    return (
      <div className="question-block">
        <div className="question-number">Q{index + 1} · Fill in the Blank · {q.points} pt{q.points !== 1 ? 's' : ''}</div>
        <div className="question-prompt" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          {parts.map((part, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span>{part}</span>
              {i < parts.length - 1 && (
                <input
                  type="text"
                  onPaste={noPaste}
                  disabled={disabled || isLocked}
                  value={localBlanks[i] ?? ''}
                  onChange={(e) => handleBlankChange(i, e.target.value)}
                  style={{
                    width: 110,
                    padding: '3px 8px',
                    background: checkResults
                      ? (checkResults[i] ? 'var(--success-dim)' : 'var(--danger-dim)')
                      : 'var(--surface)',
                    border: `1.5px solid ${checkResults
                      ? (checkResults[i] ? 'var(--success)' : 'var(--danger)')
                      : 'var(--accent)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                  }}
                />
              )}
            </span>
          ))}
        </div>
        {!isLocked && !disabled && (
          <button
            className="btn btn-primary btn-sm mt-2"
            onClick={handleCheck}
            disabled={!allFilled}
          >
            Check Answers
          </button>
        )}
        {checkResults && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: allCorrect ? 'var(--success)' : 'var(--danger)' }}>
              {allCorrect ? '✓ All correct!' : `${checkResults.filter(Boolean).length}/${checkResults.length} correct.`}
              {isLocked && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> · Answer locked.</span>}
            </span>
            {!allCorrect && !disabled && (
              disputeStatus === 'pending' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-light)', fontWeight: 600 }}>⏳ Under review</span>
              ) : disputeStatus === 'accepted' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✅ Dispute accepted</span>
              ) : disputeStatus === 'dismissed' ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>❌ Dispute dismissed</span>
              ) : !isDisputing ? (
                <button
                  onClick={() => setIsDisputing(true)}
                  title="Raise a dispute — ask your teacher to review this"
                  style={{
                    background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent-light)',
                    borderRadius: 'var(--radius-sm)', padding: '3px 10px', fontSize: '0.75rem',
                    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  }}
                >
                  ✋ Dispute
                </button>
              ) : (
                <div style={{ flexBasis: '100%', marginTop: 8 }}>
                  <textarea className="form-input form-textarea" rows={2} 
                    placeholder="Why do you think your answer should be accepted?"
                    value={draftDispute} onChange={e => setDraftDispute(e.target.value)} 
                    style={{ fontSize: '0.8rem', minHeight: 60 }} 
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn btn-primary btn-sm" style={{ fontSize: '0.72rem' }} onClick={submitDispute} disabled={!draftDispute.trim()}>Submit Dispute</button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.72rem' }} onClick={() => setIsDisputing(false)}>Cancel</button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Short Answer ──────────────────────────────────────────────────────────
  return (
    <div className="question-block">
      {!hidePrompt && (
        <>
          <div className="question-number">Q{index + 1} · {q.points} pt{q.points !== 1 ? 's' : ''}</div>
          <div className="question-prompt">{q.text}</div>
        </>
      )}
      <textarea
        className="form-input form-textarea"
        placeholder="Write your response here…"
        value={strVal}
        onChange={(e) => onChange(e.target.value)}
        onPaste={noPaste}
        disabled={disabled}
        rows={3}
      />
    </div>
  );
}
