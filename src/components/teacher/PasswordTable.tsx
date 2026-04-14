import { useState } from 'react';
import type { Student } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  students: Student[];
}

export function PasswordTable({ students }: Props) {
  const updatePassword = useAppStore((s) => s.updatePassword);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const handleChange = (id: string, val: string) => {
    setEditing((prev) => ({ ...prev, [id]: val }));
    setSaved((prev) => ({ ...prev, [id]: false }));
  };

  const handleSave = async (student: Student) => {
    const pw = editing[student.id] ?? student.password;
    await updatePassword(student.id, pw);
    setSaved((prev) => ({ ...prev, [student.id]: true }));
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="pass-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Password</th>
            <th>Stop</th>
            <th>Sessions</th>
            <th>Flagged</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const currentPw = editing[s.id] ?? s.password;
            const isDirty = currentPw !== s.password;
            return (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.displayName}</td>
                <td>
                  <input
                    type="text"
                    className="pass-edit-input"
                    value={currentPw}
                    onChange={(e) => handleChange(s.id, e.target.value)}
                    onPaste={(e) => e.preventDefault()}
                  />
                </td>
                <td>
                  <span className="badge badge-accent">Checkpoint {s.currentStop}</span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{s.completedSessions.length}</td>
                <td>
                  {s.flaggedForCheckpoint
                    ? <span className="badge badge-amber">🚩 Yes</span>
                    : <span className="text-muted text-xs">—</span>}
                </td>
                <td>
                  {isDirty && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleSave(s)}
                    >
                      Save
                    </button>
                  )}
                  {saved[s.id] && !isDirty && (
                    <span className="text-success text-xs">✓ Saved</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
