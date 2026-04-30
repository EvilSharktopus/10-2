import { useState } from 'react';
import { STOPS } from '../../data/stops';
import { gradeStudent } from '../../utils/grading';
import type { Student } from '../../types';

interface Props {
  students: Student[];
  onOpenStudent: (student: Student, tab: 'summary' | 'responses' | 'outcomes' | 'override') => void;
}

export function GradesPanel({ students, onOpenStudent }: Props) {
  const [selectedStopId, setSelectedStopId] = useState<number>(STOPS[0]?.id ?? 1);

  const stop = STOPS.find((s) => s.id === selectedStopId);

  // Build rows
  const rows = [...students]
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .map((student) => {
      const grade = gradeStudent(student.responses ?? {});
      const stopGrade = grade.byStop.find((sg) => sg.stopId === selectedStopId);

      // Auto score — attempted possible only (don't penalise for unattempted questions)
      let autoEarned = 0;
      let autoAttemptedPossible = 0;
      for (const session of stopGrade?.sessions ?? []) {
        for (const item of session.items) {
          if (item.gradedBy === 'auto' && item.hasResponse) {
            autoEarned += item.earned;
            autoAttemptedPossible += item.possible;
          }
        }
      }

      // Manual (teacher-scored) items for this checkpoint
      let manualEarned = 0;
      let manualPossible = 0;
      let manualPending = 0;

      for (const session of stopGrade?.sessions ?? []) {
        for (const item of session.items) {
          if (item.gradedBy === 'teacher' && item.hasResponse) {
            const scoreKey = item.id + '_score';
            const existingScore = student.responses?.[scoreKey];
            if (existingScore !== undefined && existingScore !== '') {
              manualEarned += Number(existingScore);
              manualPossible += item.possible;
            } else {
              manualPending++;
              manualPossible += item.possible;
            }
          }
        }
      }

      // % of sessions in this checkpoint that are completed
      // Sessions are stored by their string id (e.g. "c1s1"), not "stopId-index"
      const checkpointSessions = stop?.sessions ?? [];
      const completedCount = checkpointSessions.filter((session) =>
        student.completedSessions.includes(session.id)
      ).length;
      const pctComplete = checkpointSessions.length > 0
        ? Math.round((completedCount / checkpointSessions.length) * 100)
        : 0;

      const totalEarned = autoEarned + manualEarned;
      const totalPossible = autoAttemptedPossible + manualPossible;
      const combinedPct = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : null;

      return {
        student,
        pctComplete,
        completedCount,
        totalSessions: checkpointSessions.length,
        autoEarned,
        autoAttemptedPossible,
        manualEarned,
        manualPossible,
        manualPending,
        totalEarned,
        totalPossible,
        combinedPct,
      };
    });

  const scoreColor = (pct: number | null) => {
    if (pct === null) return 'var(--text-muted)';
    if (pct >= 75) return 'var(--success)';
    if (pct >= 50) return 'var(--amber)';
    return 'var(--danger)';
  };

  const col: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'right',
    fontSize: '0.85rem',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
  };
  const colLeft: React.CSSProperties = { ...col, textAlign: 'left' };
  const headCol: React.CSSProperties = {
    ...col,
    fontSize: '0.72rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    color: 'var(--text-muted)',
    background: 'var(--surface)',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>

      {/* Checkpoint selector */}
      <div style={{ marginBottom: 20 }}>
        <div className="text-xs text-muted mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
          Select Checkpoint
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STOPS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedStopId(s.id)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontWeight: 700, fontSize: '0.82rem',
                background: selectedStopId === s.id ? 'var(--accent)' : 'var(--surface)',
                color: selectedStopId === s.id ? '#fff' : 'var(--text-muted)',
                border: `1.5px solid ${selectedStopId === s.id ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              CP {s.id} — {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Grade table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headCol, textAlign: 'left', minWidth: 160 }}>Student</th>
                <th style={{ ...headCol, minWidth: 110 }}>% Complete</th>
                <th style={{ ...headCol, minWidth: 120 }}>Auto Score</th>
                <th style={{ ...headCol, minWidth: 130 }}>Manual Score</th>
                <th style={{ ...headCol, minWidth: 130 }}>Combined</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ ...col, textAlign: 'center', color: 'var(--text-muted)', padding: '32px 0' }}>
                    No students yet.
                  </td>
                </tr>
              ) : (
                rows.map(({ student, pctComplete, completedCount, totalSessions, autoEarned, autoAttemptedPossible, manualEarned, manualPossible, manualPending, totalEarned, totalPossible, combinedPct }) => {
                  const completePctColor = pctComplete >= 100 ? 'var(--success)' : pctComplete > 0 ? 'var(--amber)' : 'var(--text-muted)';
                  return (
                    <tr
                      key={student.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOpenStudent(student, 'responses')}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                    >
                      {/* Name */}
                      <td style={colLeft}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
                          {student.displayName}
                        </div>
                        <div className="text-xs text-muted">CP {student.currentStop} active</div>
                      </td>

                      {/* % Complete */}
                      <td style={col}>
                        <div style={{ fontWeight: 800, color: completePctColor, fontSize: '1rem' }}>
                          {pctComplete}%
                        </div>
                        <div className="text-xs text-muted">{completedCount}/{totalSessions} sessions</div>
                      </td>

                      {/* Auto Score */}
                      <td style={col}>
                        {autoAttemptedPossible > 0 ? (
                          <>
                            <div style={{ fontWeight: 700, color: scoreColor(Math.round(autoEarned / autoAttemptedPossible * 100)) }}>
                              {autoEarned} / {autoAttemptedPossible}
                            </div>
                            <div className="text-xs text-muted">{Math.round(autoEarned / autoAttemptedPossible * 100)}%</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      {/* Manual Score */}
                      <td style={col}>
                        {manualPossible > 0 ? (
                          <>
                            <div style={{ fontWeight: 700, color: scoreColor(manualPossible > 0 ? Math.round(manualEarned / manualPossible * 100) : null) }}>
                              {manualEarned} / {manualPossible}
                            </div>
                            {manualPending > 0
                              ? <span className="badge badge-amber" style={{ fontSize: '0.62rem' }}>📝 {manualPending} unscored</span>
                              : <div className="text-xs text-muted">{Math.round(manualEarned / manualPossible * 100)}%</div>
                            }
                          </>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      {/* Combined */}
                      <td style={col}>
                        {totalPossible > 0 ? (
                          <>
                            <div style={{ fontWeight: 800, fontSize: '1rem', color: scoreColor(combinedPct) }}>
                              {combinedPct !== null ? `${combinedPct}%` : '—'}
                            </div>
                            <div className="text-xs text-muted">{totalEarned} / {totalPossible} pts</div>
                          </>
                        ) : (
                          <span className="text-xs text-muted">Not started</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="text-xs text-muted mt-3" style={{ textAlign: 'right' }}>
        Click any row to open that student's responses. Combined = auto + all teacher-scored items for this checkpoint.
      </div>
    </div>
  );
}
