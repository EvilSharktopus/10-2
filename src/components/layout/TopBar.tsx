import type { Student } from '../../types';
import { CheckpointFlag } from '../student/CheckpointFlag';
import { gradeStudent } from '../../utils/grading';

interface Props {
  student: Student;
  onGlossaryOpen: () => void;
  onMenuToggle: () => void;
  onLogout: () => void;
  progressPercent: number;
}

export function TopBar({ student, onGlossaryOpen, onMenuToggle, onLogout, progressPercent }: Props) {
  const grade = gradeStudent(student.responses ?? {});
  const hasAttempted = grade.autoAttemptedPossible > 0;
  const pct = grade.autoPercent;
  const pctColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">☰</button>
        <div>
          <div className="topbar-name">{student.shortName}</div>
          <div className="text-xs text-muted">Checkpoint {student.currentStop}</div>
        </div>
      </div>

      <div className="topbar-right">
        {/* Auto-score chip */}
        {hasAttempted && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'var(--surface)', border: `1.5px solid ${pctColor}`,
            borderRadius: 20, padding: '4px 12px',
            fontSize: '0.78rem', fontWeight: 700, color: pctColor,
          }}>
            ⭐ {grade.autoEarned}/{grade.autoAttemptedPossible} pts
            <span style={{ opacity: 0.7, fontWeight: 400 }}>({pct}%)</span>
          </div>
        )}
        <CheckpointFlag studentId={student.id} />
        <button className="glossary-btn" onClick={onGlossaryOpen}>
          📖 Glossary
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>
          Sign out
        </button>
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </header>
  );
}
