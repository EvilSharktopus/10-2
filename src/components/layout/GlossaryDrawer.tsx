import { useState } from 'react';
import { GLOSSARY_TERMS } from '../../data/glossary';
import type { Student } from '../../types';

interface Props {
  open: boolean;
  onClose: () => void;
  student: Student;
}

export function GlossaryDrawer({ open, onClose, student }: Props) {
  const [search, setSearch] = useState('');

  // Only show terms from completed stops
  const maxStop = Math.max(0, ...student.unlockedStops);
  const available = GLOSSARY_TERMS.filter(
    (t) => t.unlockedAfterStop <= maxStop && student.completedSessions.length > 0
  );

  const filtered = available.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 149,
            background: 'transparent',
          }}
          onClick={onClose}
        />
      )}
      <aside className={`glossary-drawer${open ? ' open' : ''}`}>
        <div className="glossary-header">
          <h3>📖 Glossary</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="glossary-search">
          <input
            type="text"
            className="form-input"
            placeholder="Search terms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onPaste={(e) => e.preventDefault()}
          />
        </div>

        <div className="glossary-list">
          {available.length === 0 && (
            <div className="glossary-empty">
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📚</div>
              <p>Complete your first stop to unlock glossary terms.</p>
            </div>
          )}
          {available.length > 0 && filtered.length === 0 && (
            <div className="glossary-empty">No terms match your search.</div>
          )}
          {filtered.map((term) => (
            <div key={term.id} className="glossary-item fade-in">
              <div className="glossary-term">{term.term}</div>
              <div className="glossary-def">{term.definition}</div>
              <div className="glossary-stop-tag">Unlocked at Checkpoint {term.unlockedAfterStop}</div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
