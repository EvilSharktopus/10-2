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
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const unlocked = student.glossaryUnlocked ?? [];
  const available = GLOSSARY_TERMS.filter((t) => unlocked.includes(t.id));

  const filtered = available.filter(
    (t) =>
      t.term.toLowerCase().includes(search.toLowerCase()) ||
      t.definition.toLowerCase().includes(search.toLowerCase())
  );

  // Group alphabetically
  const grouped: Record<string, typeof filtered> = {};
  for (const term of filtered) {
    const letter = term.term[0].toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(term);
  }
  const letters = Object.keys(grouped).sort();

  const toggleTerm = (id: string) =>
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  // Auto-expand all when searching
  const isExpanded = (id: string) =>
    search.trim().length > 0 ? true : (expandedIds[id] ?? false);

  return (
    <>
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 149, background: 'transparent' }}
          onClick={onClose}
        />
      )}
      <aside className={`glossary-drawer${open ? ' open' : ''}`}>
        <div className="glossary-header">
          <h3>📖 Glossary <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>({available.length} terms)</span></h3>
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
              <p>Your glossary is empty for now.</p>
              <p style={{ fontSize: '0.8rem' }}>Terms appear here as you complete vocabulary activities.</p>
            </div>
          )}
          {available.length > 0 && filtered.length === 0 && (
            <div className="glossary-empty">No terms match your search.</div>
          )}

          {letters.map((letter) => (
            <div key={letter} style={{ marginBottom: 8 }}>
              {/* Letter header */}
              <div style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: 'var(--accent-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '6px 12px 4px',
                borderBottom: '1px solid var(--border)',
              }}>
                {letter}
              </div>

              {grouped[letter].map((term) => {
                const expanded = isExpanded(term.id);
                return (
                  <div
                    key={term.id}
                    className="glossary-item"
                    style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={() => toggleTerm(term.id)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div className="glossary-term" style={{ marginBottom: 0 }}>{term.term}</div>
                      <span style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        transition: 'transform 0.2s',
                        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                        flexShrink: 0,
                      }}>▶</span>
                    </div>

                    {expanded && (
                      <div
                        className="glossary-def fade-in"
                        style={{ marginTop: 8 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {term.definition}
                        <div className="glossary-stop-tag" style={{ marginTop: 6 }}>Checkpoint {term.unlockedAfterStop}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
