import { useState } from 'react';
import type { Student } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { gradeStudent } from '../../utils/grading';
import type { GradeItem, StudentGrade } from '../../utils/grading';

interface Props {
  students: Student[];
  onOpenStudent: (student: Student, tab: 'responses') => void;
}

export function ReviewPanel({ students, onOpenStudent }: Props) {
  const saveResponse = useAppStore((s) => s.saveResponse);

  const studentsWithPending = students
    .map((student) => ({ student, grade: gradeStudent(student.responses ?? {}) }))
    .filter(({ grade }) => grade.teacherPending > 0);

  if (studentsWithPending.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: 8 }}>
          All caught up!
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No submissions waiting to be reviewed.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>
        {studentsWithPending.length} student{studentsWithPending.length > 1 ? 's' : ''} with unscored submissions
      </div>
      {studentsWithPending.map(({ student, grade }) => (
        <StudentReviewBlock
          key={student.id}
          student={student}
          grade={grade}
          onScore={(key, val) => saveResponse(student.id, key, val)}
          onOpen={() => onOpenStudent(student, 'responses')}
        />
      ))}
    </div>
  );
}

// ─── Per-student block ────────────────────────────────────────────────────────
interface BlockProps {
  student: Student;
  grade: StudentGrade;
  onScore: (key: string, val: string) => void;
  onOpen: () => void;
}

function StudentReviewBlock({ student, grade, onScore, onOpen }: BlockProps) {
  const [collapsed, setCollapsed] = useState(false);
  const responses = student.responses ?? {};

  // Collect unscored teacher-graded items with their context
  const pendingItems: { item: GradeItem; stopTitle: string; sessionTitle: string }[] = [];
  for (const stop of grade.byStop) {
    for (const session of stop.sessions) {
      for (const item of session.items) {
        if (item.gradedBy === 'teacher' && item.hasResponse) {
          const existing = responses[item.id + '_score'];
          if (existing === undefined || existing === '') {
            pendingItems.push({ item, stopTitle: stop.stopTitle, sessionTitle: session.sessionTitle });
          }
        }
      }
    }
  }

  if (pendingItems.length === 0) return null;

  const initials = student.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Student header row */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 20px', background: 'var(--surface)',
          borderBottom: collapsed ? 'none' : '1px solid var(--border)',
          cursor: 'pointer',
        }}
        onClick={() => setCollapsed((c) => !c)}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--accent-dim)', border: '2px solid var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '0.85rem', color: 'var(--accent-light)', flexShrink: 0,
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{student.displayName}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {pendingItems.length} response{pendingItems.length > 1 ? 's' : ''} to score
          </div>
        </div>
        <span className="badge badge-amber">📝 {pendingItems.length}</span>
        <button
          className="btn btn-ghost btn-sm"
          style={{ fontSize: '0.72rem', marginLeft: 4 }}
          onClick={(e) => { e.stopPropagation(); onOpen(); }}
        >
          Full Profile →
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 4 }}>
          {collapsed ? '▶' : '▼'}
        </span>
      </div>

      {/* Pending item rows */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pendingItems.map(({ item, stopTitle, sessionTitle }, idx) => (
            <PendingItemRow
              key={item.id}
              item={item}
              stopTitle={stopTitle}
              sessionTitle={sessionTitle}
              isLast={idx === pendingItems.length - 1}
              onScore={onScore}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Individual pending item ───────────────────────────────────────────────────
interface RowProps {
  item: GradeItem;
  stopTitle: string;
  sessionTitle: string;
  isLast: boolean;
  onScore: (key: string, val: string) => void;
}

function PendingItemRow({ item, stopTitle, sessionTitle, isLast, onScore }: RowProps) {
  const scoreKey = item.id + '_score';
  const [localScore, setLocalScore] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleScore = async (pts: number) => {
    setLocalScore(pts);
    setSaving(true);
    await onScore(scoreKey, String(pts));
    setSaving(false);
    setSaved(true);
  };

  return (
    <div style={{
      padding: '14px 20px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', gap: 8,
      background: saved ? 'var(--success-dim)' : 'var(--card)',
      transition: 'background 0.3s',
    }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {stopTitle} · {sessionTitle}
      </div>

      {/* Prompt */}
      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
        {item.prompt}
      </div>

      {/* Response */}
      <div style={{
        fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.55,
        background: 'var(--surface)', borderRadius: 'var(--radius-sm)',
        padding: '8px 12px', border: '1px solid var(--border)',
        maxHeight: 130, overflowY: 'auto', whiteSpace: 'pre-wrap',
      }}>
        {item.response || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No response submitted</span>}
      </div>

      {/* Score picker / saved state */}
      {saved ? (
        <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>
          ✓ Scored {localScore}/{item.possible} pts — will clear when page updates
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Score / {item.possible}:
          </span>
          {Array.from({ length: item.possible + 1 }, (_, i) => i).map((pts) => (
            <button
              key={pts}
              onClick={() => handleScore(pts)}
              disabled={saving}
              style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                border: `2px solid ${localScore === pts ? 'var(--accent)' : 'var(--border)'}`,
                background: localScore === pts ? 'var(--accent)' : 'var(--surface)',
                color: localScore === pts ? '#fff' : 'var(--text-primary)',
                fontWeight: 800, fontSize: '0.9rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {pts}
            </button>
          ))}
          {saving && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saving…</span>}
        </div>
      )}
    </div>
  );
}
