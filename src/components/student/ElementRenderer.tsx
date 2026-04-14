import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type {
  StopElement,
  HookElement,
  GlossaryElement,
  VideoElement,
  TaskElement,
  SortTask,
  TChartTask,
  TrueFalseListTask,
  FreeResponseTask,
  ReflectionElement,
  SourceAnalysisElement,
  ActivityElement,
  CheckpointPrepElement,
} from '../../types';
import { QuestionBlock } from './QuestionBlock';

const noPaste = (e: React.ClipboardEvent) => e.preventDefault();

// ─── ElementRenderer (router) ────────────────────────────────────────────────
interface Props {
  element: StopElement;
  responses: Record<string, string | string[]>;
  onSave: (key: string, value: string | string[]) => void;
  disabled?: boolean;
  chunkIndex?: number;
}

// Thin wrapper so onSave can accept string for lock flags
function saveFlag(onSave: Props['onSave']) {
  return (key: string, val: string) => onSave(key, val);
}

export function ElementRenderer({ element, responses, onSave, disabled, chunkIndex = 0 }: Props) {
  switch (element.type) {
    case 'hook':            return <Hook el={element} />;
    case 'glossary':        return <Glossary el={element} responses={responses} onSave={onSave} disabled={disabled} />;
    case 'video':           return <Video el={element} responses={responses} onSave={onSave} disabled={disabled} chunkIndex={chunkIndex} />;
    case 'tasks':           return <Task el={element} responses={responses} onSave={onSave} disabled={disabled} />;
    case 'reflection':      return <Reflection el={element} responses={responses} onSave={onSave} disabled={disabled} />;
    case 'source_analysis': return <SourceAnalysis el={element} responses={responses} onSave={onSave} disabled={disabled} />;
    case 'activity':        return <Activity el={element} responses={responses} onSave={onSave} disabled={disabled} />;
    case 'checkpoint_prep': return <CheckpointPrep el={element} />;
    default:                return null;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────
function Hook({ el }: { el: HookElement }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--accent-dim), var(--amber-dim))',
      border: '1.5px solid var(--border-glow)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)', marginBottom: 8 }}>
        Think About This
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.55, fontStyle: 'italic' }}>
        "{el.content}"
      </div>
    </div>
  );
}

// ─── Glossary ─────────────────────────────────────────────────────────────────
function Glossary({ el, responses, onSave, disabled }: { el: GlossaryElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 6, color: 'var(--accent-light)' }}>📚 Vocabulary</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{el.instruction}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {el.terms.map((t) => {
          const key = t.id;
          const val = (responses[key] ?? '') as string;
          return (
            <div key={t.id}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{t.term}</div>
              <textarea
                className="form-input form-textarea"
                placeholder={`Define "${t.term}" in your own words…`}
                value={val}
                onChange={(e) => onSave(key, e.target.value)}
                onPaste={noPaste}
                disabled={disabled}
                rows={2}
                style={{ minHeight: 60 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Video ────────────────────────────────────────────────────────────────────
function Video({ el, responses, onSave, disabled, chunkIndex = 0 }: { el: VideoElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean; chunkIndex?: number }) {
  const chunk = el.chunks[chunkIndex] ?? el.chunks[0];
  const embedUrl = `https://www.youtube.com/embed/${el.youtube_id}?start=${chunk.start_seconds}&end=${chunk.end_seconds}&rel=0&modestbranding=1`;

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🎬 {el.title}</div>

      {/* Section label when multi-chunk */}
      {el.chunks.length > 1 && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10, fontWeight: 600 }}>
          Section {chunkIndex + 1} of {el.chunks.length}: {chunk.title}
        </div>
      )}

      {/* Embed */}
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: 16, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
        <iframe
          key={`${el.youtube_id}-${chunkIndex}`}
          src={embedUrl}
          title={chunk.title}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 14 }}>
        ⏱ Watch from {fmt(chunk.start_seconds)} → {fmt(chunk.end_seconds)}, then answer below.
      </div>

      {chunk.questions.map((q, qi) => (
        <QuestionBlock
          key={q.id}
          question={q}
          index={qi}
          value={responses[q.id] ?? ''}
          onChange={(v) => onSave(q.id, v)}
          allResponses={responses}
          onSaveFlag={saveFlag(onSave)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, '0');
  return `${m}:${sec}`;
}

// ─── Task (routes to sub-types) ───────────────────────────────────────────────
function Task({ el, responses, onSave, disabled }: { el: TaskElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  if (el.task_type === 'sort')            return <WordSort el={el as SortTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'tchart')          return <TChart el={el as TChartTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'true_false_list') return <TFList el={el as TrueFalseListTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'free_response')   return <FreeResponse el={el as FreeResponseTask} responses={responses} onSave={onSave} disabled={disabled} />;
  return null;
}

// ─── Word Sort ────────────────────────────────────────────────────────────────
function WordSort({ el, responses, onSave, disabled }: { el: SortTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const savedKey = `${el.id}_sort`;
  const savedRaw = responses[savedKey];
  const saved: Record<string, string> = savedRaw && typeof savedRaw === 'string' ? JSON.parse(savedRaw) : {};

  const lockKey = `${el.id}_sort_locked`;
  const isPersistedLocked = responses[lockKey] === '1';
  const [placement, setPlacement] = useState<Record<string, string>>(saved);
  const [selected, setSelected] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [checked, setChecked] = useState(isPersistedLocked);

  const place = (itemId: string, colId: string) => {
    if (disabled || checked) return;
    const next = { ...placement, [itemId]: colId };
    setPlacement(next);
    onSave(savedKey, JSON.stringify(next));
    setSelected(null);
  };

  const returnToBank = (itemId: string) => {
    if (disabled || checked) return;
    const next = { ...placement };
    delete next[itemId];
    setPlacement(next);
    onSave(savedKey, JSON.stringify(next));
    setSelected(null);
  };

  const unplaced = el.items.filter((i) => !placement[i.id]);
  const allPlaced = unplaced.length === 0;
  const correctCount = checked ? el.items.filter((i) => placement[i.id] === i.correct_column).length : 0;

  const chipStyle = (itemId: string, inBank = false): React.CSSProperties => {
    const isSelected = selected === itemId;
    return {
      padding: '7px 14px',
      borderRadius: 20,
      fontSize: '0.88rem',
      fontWeight: 600,
      cursor: disabled || checked ? 'default' : 'grab',
      userSelect: 'none',
      background: isSelected ? 'var(--accent)' : inBank ? 'var(--surface)' : 'var(--card)',
      border: `1.5px solid ${isSelected ? 'var(--accent-light)' : 'var(--border)'}`,
      color: isSelected ? '#fff' : 'var(--text-primary)',
      boxShadow: isSelected ? '0 0 0 3px var(--accent-dim)' : 'none',
      transition: 'all 0.15s',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
    };
  };

  const dropZoneStyle = (colId: string): React.CSSProperties => ({
    background: dragOver === colId ? 'var(--accent-dim)' : 'var(--surface)',
    border: `2px dashed ${dragOver === colId ? 'var(--accent)' : selected ? 'var(--accent-dim)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    padding: 14,
    minHeight: 110,
    transition: 'all 0.15s',
    cursor: selected ? 'pointer' : 'default',
  });

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🔀 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{el.instruction}</div>

      {!checked && !disabled && (
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14, fontStyle: 'italic' }}>
          {selected
            ? `"${el.items.find(i => i.id === selected)?.text}" selected — click a column to place it, or click the word again to deselect.`
            : 'Drag words into the right column, or click a word then click its column.'}
        </div>
      )}

      {/* Word bank */}
      {unplaced.length > 0 && (
        <div style={{
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '12px 14px',
          marginBottom: 16,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
        }}>
          {unplaced.map((item) => (
            <div
              key={item.id}
              draggable={!disabled && !checked}
              style={chipStyle(item.id, true)}
              onClick={() => {
                if (disabled || checked) return;
                setSelected(selected === item.id ? null : item.id);
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData('itemId', item.id);
                setSelected(null);
              }}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}

      {unplaced.length === 0 && !checked && (
        <div style={{ fontSize: '0.82rem', color: 'var(--success)', marginBottom: 12, fontWeight: 600 }}>
          ✓ All words placed! Hit "Check Sort" when you're happy.
        </div>
      )}

      {/* Drop columns */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.columns.length}, 1fr)`, gap: 12 }}>
        {el.columns.map((col) => {
          const colItems = el.items.filter((i) => placement[i.id] === col.id);
          return (
            <div
              key={col.id}
              style={dropZoneStyle(col.id)}
              onClick={() => { if (selected) place(selected, col.id); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData('itemId');
                if (itemId) place(itemId, col.id);
                setDragOver(null);
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.label}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {colItems.map((item) => {
                  const isCorrect = checked ? item.correct_column === col.id : null;
                  return (
                    <div
                      key={item.id}
                      draggable={!disabled && !checked}
                      style={{
                        ...chipStyle(item.id),
                        background: checked
                          ? (isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)')
                          : selected === item.id ? 'var(--accent)' : 'var(--card)',
                        border: `1.5px solid ${checked
                          ? (isCorrect ? 'var(--success)' : 'var(--danger)')
                          : selected === item.id ? 'var(--accent-light)' : 'var(--border)'}`,
                        color: checked ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--text-primary)',
                        cursor: disabled || checked ? 'default' : 'grab',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (disabled || checked) return;
                        if (selected === item.id) { setSelected(null); return; }
                        returnToBank(item.id);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('itemId', item.id);
                        returnToBank(item.id);
                      }}
                    >
                      {item.text}
                      {checked && <span>{isCorrect ? ' ✓' : ' ✗'}</span>}
                    </div>
                  );
                })}
              </div>
              {colItems.length === 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                  Drop here
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!checked && allPlaced && !disabled && (
        <button className="btn btn-primary btn-sm mt-3" onClick={() => { setChecked(true); onSave(lockKey, '1'); }}>Check Sort</button>
      )}
      {checked && (
        <div style={{ marginTop: 12, fontWeight: 700, fontSize: '0.88rem', color: correctCount === el.items.length ? 'var(--success)' : 'var(--amber)' }}>
          {correctCount === el.items.length ? '🎉 Perfect!' : `${correctCount}/${el.items.length} correct — review the highlighted ones.`}
        </div>
      )}
    </div>
  );
}


// ─── T-Chart ──────────────────────────────────────────────────────────────────
function TChart({ el, responses, onSave, disabled }: { el: TChartTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📊 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${el.columns.length}, 1fr)`, gap: 12 }}>
        {el.columns.map((col) => {
          const key = `${el.id}_${col.id}`;
          const rawVal = responses[key];
          const rows: string[] = Array.isArray(rawVal) ? rawVal : (rawVal ? [rawVal] : ['', '', '', '']);

          const updateRow = (i: number, v: string) => {
            const next = [...rows];
            next[i] = v;
            onSave(key, next.filter((_, idx) => idx < next.length));
          };
          const addRow = () => {
            onSave(key, [...rows, '']);
          };

          return (
            <div key={col.id} style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {col.label}
              </div>
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map((row, i) => (
                  <textarea
                    key={i}
                    className="form-input"
                    placeholder={`Point ${i + 1}…`}
                    value={row}
                    onChange={(e) => updateRow(i, e.target.value)}
                    onPaste={noPaste}
                    disabled={disabled}
                    rows={2}
                    style={{ fontSize: '0.85rem', minHeight: 52 }}
                  />
                ))}
                {!disabled && (
                  <button className="btn btn-ghost btn-sm" onClick={addRow} style={{ fontSize: '0.78rem' }}>+ Add row</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── T/F Review List ──────────────────────────────────────────────────────────
function TFList({ el, responses, onSave, disabled }: { el: TrueFalseListTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const lockKey = `${el.id}_tfl_locked`;
  const [checked, setChecked] = useState(responses[lockKey] === '1');
  const allAnswered = el.items.every((item) => responses[item.id]);

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>✅ {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {el.items.map((item, i) => {
          const val = (responses[item.id] ?? '') as string;
          const isCorrect = checked ? (val === 'True') === item.correct_answer : null;
          return (
            <div key={item.id} style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: checked ? (isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)') : 'var(--surface)',
              border: `1.5px solid ${checked ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', flex: 1 }}>{i + 1}. {item.text}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['True', 'False'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => onSave(item.id, opt)}
                    disabled={disabled || checked}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: val === opt ? 'var(--accent-dim)' : 'var(--card)',
                      border: `1.5px solid ${val === opt ? 'var(--accent)' : 'var(--border)'}`,
                      color: val === opt ? 'var(--accent-light)' : 'var(--text-muted)',
                      fontWeight: 700, fontSize: '0.8rem', cursor: (disabled || checked) ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {opt}
                  </button>
                ))}
                {checked && <span style={{ fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>{isCorrect ? '✓' : '✗'}</span>}
              </div>
            </div>
          );
        })}
      </div>
      {!checked && allAnswered && !disabled && (
        <button className="btn btn-primary btn-sm mt-3" onClick={() => { setChecked(true); onSave(lockKey, '1'); }}>Check Answers</button>
      )}
      {checked && (
        <div style={{ marginTop: 10, fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>
          {el.items.filter((i) => (responses[i.id] === 'True') === i.correct_answer).length}/{el.items.length} correct
        </div>
      )}
    </div>
  );
}

// ─── Free Response Task ───────────────────────────────────────────────────────
function FreeResponse({ el, responses, onSave, disabled }: { el: FreeResponseTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📰 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 10 }}>{el.instruction}</div>
      {el.ai_proof_note && (
        <div style={{ background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: '0.8rem', color: 'var(--amber)', marginBottom: 14 }}>
          ⚠️ {el.ai_proof_note}
        </div>
      )}
      {el.fields.map((f) => {
        const val = (responses[f.id] ?? '') as string;
        return (
          <div key={f.id} className="form-group">
            <label className="form-label">{f.label}</label>
            {f.type === 'text_area' ? (
              <textarea className="form-input form-textarea" value={val} onChange={(e) => onSave(f.id, e.target.value)} onPaste={noPaste} disabled={disabled} rows={3} />
            ) : (
              <input type="text" className="form-input" value={val} onChange={(e) => onSave(f.id, e.target.value)} onPaste={noPaste} disabled={disabled} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reflection ───────────────────────────────────────────────────────────────
function Reflection({ el, responses, onSave, disabled }: { el: ReflectionElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>💭 Reflection</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      {el.prompts.map((p, i) => {
        const val = (responses[p.id] ?? '') as string;
        return (
          <div key={p.id} className="question-block">
            <div className="question-number">Reflection {i + 1}</div>
            <div className="question-prompt">{p.text}</div>
            <textarea
              className="form-input form-textarea"
              placeholder="Your thoughts…"
              value={val}
              onChange={(e) => onSave(p.id, e.target.value)}
              onPaste={noPaste}
              disabled={disabled}
              rows={3}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Source Analysis ──────────────────────────────────────────────────────────
function SourceAnalysis({ el, responses, onSave, disabled }: { el: SourceAnalysisElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const activeStep = el.steps.find((s) => s.active);
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🔍 {el.title}</div>
      {el.context && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10, fontStyle: 'italic' }}>{el.context}</div>}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {el.steps.map((s) => (
          <div key={s.step} style={{
            padding: '5px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.78rem',
            fontWeight: 700,
            background: s.active ? 'var(--accent)' : 'var(--surface)',
            color: s.active ? '#fff' : 'var(--text-muted)',
            border: `1px solid ${s.active ? 'var(--accent)' : 'var(--border)'}`,
            opacity: s.active ? 1 : 0.5,
          }}>
            {s.step}. {s.label} {!s.active && '🔒'}
          </div>
        ))}
      </div>

      {activeStep?.questions?.map((q, qi) => (
        <QuestionBlock
          key={q.id}
          question={q}
          index={qi}
          value={responses[q.id] ?? ''}
          onChange={(v) => onSave(q.id, v)}
          allResponses={responses}
          onSaveFlag={saveFlag(onSave)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// ─── Activity ─────────────────────────────────────────────────────────────────
function Activity({ el, responses, onSave, disabled }: { el: ActivityElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const student = useAppStore((s) => s.currentStudent);
  const flagCheckpoint = useAppStore((s) => s.flagCheckpoint);
  const flagged = student?.flaggedForCheckpoint ?? false;

  const handleMaterialsRequest = async () => {
    if (!student) return;
    await flagCheckpoint(student.id, !flagged);
  };

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🗺 {el.title}</div>
      {el.physical_component && (
        <div style={{
          background: flagged ? 'var(--amber-dim)' : 'var(--accent-dim)',
          border: `1px solid ${flagged ? 'var(--amber)' : 'var(--accent)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          fontSize: '0.85rem',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: flagged ? 'var(--amber)' : 'var(--accent-light)' }}>
            {flagged ? '🚩 Waiting for Mr. McRae…' : '📋 You will need physical materials for this activity.'}
          </span>
          {!disabled && (
            <button
              onClick={handleMaterialsRequest}
              style={{
                background: flagged ? 'var(--amber)' : 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {flagged ? '✕ Cancel Request' : '✋ Ask Mr. McRae'}
            </button>
          )}
        </div>
      )}
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

      {/* Table fields */}
      {el.fields?.map((f) => {
        if (f.type === 'table') {
          const key = f.id;
          const rawVal = responses[key];
          const rows: string[][] = rawVal && typeof rawVal === 'string'
            ? JSON.parse(rawVal)
            : Array.from({ length: f.rows }, () => f.columns.map(() => ''));

          const updateCell = (ri: number, ci: number, v: string) => {
            const next = rows.map((r, ri2) => ri2 === ri ? r.map((c, ci2) => ci2 === ci ? v : c) : r);
            onSave(key, JSON.stringify(next));
          };

          return (
            <div key={key} style={{ overflowX: 'auto', marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    {f.columns.map((col) => (
                      <th key={col} style={{ padding: '8px 12px', borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>
                          <input
                            type="text"
                            className="form-input"
                            value={cell}
                            onChange={(e) => updateCell(ri, ci, e.target.value)}
                            onPaste={noPaste}
                            disabled={disabled}
                            style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;
      })}

      {/* Questions */}
      {el.questions?.map((q, qi) => (
        <QuestionBlock
          key={q.id}
          question={q}
          index={qi}
          value={responses[q.id] ?? ''}
          onChange={(v) => onSave(q.id, v)}
          allResponses={responses}
          onSaveFlag={saveFlag(onSave)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

// ─── Checkpoint Prep ──────────────────────────────────────────────────────────
function CheckpointPrep({ el }: { el: CheckpointPrepElement }) {
  return (
    <div style={{
      background: 'var(--amber-dim)',
      border: '2px solid var(--amber)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      marginBottom: 24,
    }}>
      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--amber)', marginBottom: 6 }}>🚩 {el.title}</div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 14 }}>{el.instruction}</div>
      <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {el.talking_points.map((pt, i) => (
          <li key={i} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>{pt}</li>
        ))}
      </ul>
      <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(244,168,67,0.3)', paddingTop: 12 }}>
        {el.lock_message}
      </div>
    </div>
  );
}
