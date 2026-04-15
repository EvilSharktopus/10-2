import { useState } from 'react';
import type { Student } from '../../types';
import { CheckpointFlag } from '../student/CheckpointFlag';
import { gradeStudent } from '../../utils/grading';
import { ResponsesPanel } from '../shared/ResponsesPanel';
import { useAppStore } from '../../store/useAppStore';
import { UserMenu } from './UserMenu';

interface Props {
  student: Student;
  onGlossaryOpen: () => void;
  onMenuToggle: () => void;
  onLogout: () => void;
  progressPercent: number;
  showCheckpointFlag: boolean;
}

export function TopBar({ student, onGlossaryOpen, onMenuToggle, onLogout, progressPercent, showCheckpointFlag }: Props) {
  const [showGradeModal, setShowGradeModal] = useState(false);
  const saveResponse = useAppStore(s => s.saveResponse);

  const grade = gradeStudent(student.responses ?? {});
  const hasAttempted = grade.autoAttemptedPossible > 0;

  return (
    <>
      <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={onMenuToggle} aria-label="Toggle menu">☰</button>
        <div>
          <div className="topbar-name">{student.shortName}</div>
          <div className="text-xs text-muted">Checkpoint {student.currentStop}</div>
        </div>
      </div>

      <div className="topbar-right">
        {showCheckpointFlag && <CheckpointFlag studentId={student.id} />}
        <button className="glossary-btn" onClick={onGlossaryOpen}>
          📖 Glossary
        </button>
        <UserMenu
          student={student}
          grade={grade}
          hasAttempted={hasAttempted}
          onLogout={onLogout}
          onShowGradeModal={() => setShowGradeModal(true)}
        />
      </div>

      <div className="progress-bar-wrap">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>
    </header>

    {showGradeModal && (
      <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowGradeModal(false); }}>
        <div className="modal-content" style={{ maxWidth: 800, padding: 0 }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 4, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>Grades & Responses</h2>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Review your scores, feedback, and active disputes here.</div>
            </div>
            <button className="btn btn-ghost" onClick={() => setShowGradeModal(false)}>Close</button>
          </div>
          <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>
            <ResponsesPanel
              grade={grade}
              responses={student.responses ?? {}}
              onScore={(key, val) => saveResponse(student.id, key, val)}
              isStudentView={true}
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
}
