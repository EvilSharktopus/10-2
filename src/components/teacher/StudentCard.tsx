import type { Student } from '../../types';
import { STOPS } from '../../data/stops';
import { gradeStudent } from '../../utils/grading';

const TOTAL_SESSIONS = STOPS.flatMap((s) => s.sessions).length;

interface Props {
  student: Student;
  onClick: () => void;
  onOpenResponses?: () => void;
}

export function StudentCard({ student, onClick, onOpenResponses }: Props) {
  const progress = TOTAL_SESSIONS > 0
    ? Math.round((student.completedSessions.length / TOTAL_SESSIONS) * 100)
    : 0;

  const currentStop = STOPS.find((s) => s.id === student.currentStop);
  const currentSession = currentStop?.sessions[student.currentSession - 1];

  const grade = gradeStudent(student.responses ?? {});
  const pct = grade.autoPossible > 0 ? Math.round((grade.autoEarned / grade.autoPossible) * 100) : null;
  const pctColor = pct == null ? 'var(--text-muted)' : pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';
  const hasPending = grade.teacherPending > 0;
  const hasDisputes = grade.disputeCount > 0;

  return (
    <div
      className={`student-card${student.flaggedForCheckpoint ? ' flagged' : ''}${hasPending ? ' has-pending' : ''}`}
      onClick={onClick}
    >
      <div className="student-card-header">
        <div>
          <div className="student-card-name">{student.displayName}</div>
          <div className="student-card-sub">
            Checkpoint {student.currentStop}
            {currentSession ? ` · ${currentSession.title.split('—')[1]?.trim() ?? currentSession.title}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
          {student.flaggedForCheckpoint && (
            <span className="badge badge-amber">🚩 Ready</span>
          )}
          {hasPending && (
            <span
              className="badge badge-amber"
              style={{ fontSize: '0.68rem', cursor: onOpenResponses ? 'pointer' : 'default' }}
              onClick={(e) => { if (onOpenResponses) { e.stopPropagation(); onOpenResponses(); } }}
              title="Click to review responses"
            >
              📝 {grade.teacherPending} to review
            </span>
          )}
          {hasDisputes && (
            <span
              className="badge"
              style={{ fontSize: '0.68rem', background: 'var(--accent-dim)', color: 'var(--accent-light)', border: '1px solid var(--accent)', cursor: onOpenResponses ? 'pointer' : 'default' }}
              onClick={(e) => { if (onOpenResponses) { e.stopPropagation(); onOpenResponses(); } }}
              title="Click to review disputes"
            >
              ✋ {grade.disputeCount} dispute{grade.disputeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="student-card-body">
        <div className="student-stat">
          <span className="student-stat-label">Sessions done</span>
          <span className="student-stat-value">{student.completedSessions.length} / {TOTAL_SESSIONS}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Auto-grade</span>
          <span className="student-stat-value" style={{ color: pctColor, fontWeight: 700 }}>
            {pct !== null ? `${pct}%` : '—'}
          </span>
        </div>
        <div className="mini-progress" style={{ position: 'relative' }}>
          <div className="mini-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-xs text-muted" style={{ textAlign: 'right', marginTop: 2 }}>{progress}% complete</div>
      </div>

      {student.flaggedForCheckpoint && (
        <div className="checkpoint-indicator">
          <div className="checkpoint-dot" />
          Waiting for checkpoint conversation
        </div>
      )}
      {hasPending && !student.flaggedForCheckpoint && (
        <div className="checkpoint-indicator" style={{ background: 'rgba(244,168,67,0.08)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
          <div className="checkpoint-dot" style={{ background: 'var(--amber)' }} />
          {grade.teacherPending} response{grade.teacherPending !== 1 ? 's' : ''} need review
        </div>
      )}
    </div>
  );
}
