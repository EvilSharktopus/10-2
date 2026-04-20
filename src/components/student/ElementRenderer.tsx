import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { DictateButton } from '../shared/SpeechToText';
import { ListenButton } from '../shared/TextToSpeech';
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
  MatchingTask,
  RatingScaleTask,
  RankingTask,
  TableTask,
  OpinionTrackerTask,
  LabelAndSelectTask,
  NewsResearchTask,
  CalculatorResponseTask,
  ComparisonChartTask,
  VocabReviewTask,
  ConnectionChartTask,
  RatingTableTask,
  ReflectionElement,
  SourceAnalysisElement,
  ActivityElement,
  ContextElement,
  CheckpointPrepElement,
} from '../../types';
import { QuestionBlock } from './QuestionBlock';
import { STOPS } from '../../data/stops';

const noPaste = (e: React.ClipboardEvent) => e.preventDefault();

function getSubmittedGlossaryTerms(sourceFilter: string | undefined, responses: Record<string, string | string[]>): { id: string; term: string }[] {
  let termOptions: { id: string; term: string }[] = [];
  
  const stopsToSearch = sourceFilter 
    ? STOPS.filter(s => {
        const match = sourceFilter.match(/checkpoint_(\d+)/);
        return match && parseInt(match[1], 10) === s.id;
      })
    : STOPS;

  stopsToSearch.forEach(stop => {
    stop.sessions.forEach(session => {
      session.elements.forEach(element => {
        if (element.type === 'glossary') {
          const glossaryEl = element as GlossaryElement;
          if (glossaryEl.terms) {
            glossaryEl.terms.forEach(t => {
              const val = responses[t.id];
              const submitted = typeof val === 'string' && val.trim().length > 0;
              if (submitted) {
                termOptions.push(t);
              }
            });
          }
        }
      });
    });
  });

  return termOptions;
}

// Returns ALL glossary terms (regardless of submission) — used for vocab review dropdowns
function getAllGlossaryTerms(): { id: string; term: string }[] {
  const terms: { id: string; term: string }[] = [];
  STOPS.forEach(stop => {
    stop.sessions.forEach(session => {
      session.elements.forEach(element => {
        if (element.type === 'glossary') {
          const glossaryEl = element as GlossaryElement;
          if (glossaryEl.terms) {
            glossaryEl.terms.forEach(t => terms.push(t));
          }
        }
      });
    });
  });
  return terms;
}

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
    case 'context':         return <ContextBlock el={element} responses={responses} onSave={onSave} disabled={disabled} />;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-light)' }}>
          Think About This
        </div>
        <ListenButton text={el.content || ''} inline />
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>📚 Vocabulary</span>
        <ListenButton text={el.instruction || ''} inline label="Listen" />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 16 }}>{el.instruction}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {el.terms.map((t) => {
          const key = t.id;
          const val = (responses[key] ?? '') as string;
          return (
            <div key={t.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.term}</span>
                <ListenButton text={t.term} inline />
              </div>
              <div className="input-with-mic">
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
                <DictateButton currentValue={val} onResult={(v) => onSave(key, v)} disabled={disabled} />
              </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>🎬 {el.title}</span>
        {el.instruction && <ListenButton text={el.instruction} inline label="Listen" />}
      </div>
      {el.instruction && (
        <div style={{ fontSize: '0.9rem', color: 'var(--amber)', padding: '10px 14px', background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: 'var(--radius)', marginBottom: 16 }} dangerouslySetInnerHTML={{ __html: el.instruction }} />
      )}

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
  if (el.task_type === 'matching')        return <Matching el={el as MatchingTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'rating_scale')    return <RatingScale el={el as RatingScaleTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'ranking')         return <Ranking el={el as RankingTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'table')           return <TableInput el={el as TableTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'opinion_tracker')   return <OpinionTracker el={el as OpinionTrackerTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'label_and_select')  return <LabelAndSelect el={el as LabelAndSelectTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'news_research')     return <FieldsForm el={el as NewsResearchTask} responses={responses} onSave={onSave} disabled={disabled} icon="📰" />;
  if (el.task_type === 'calculator_response') return <FieldsForm el={el as CalculatorResponseTask} responses={responses} onSave={onSave} disabled={disabled} icon="🧮" />;
  if (el.task_type === 'comparison_chart')  return <ComparisonChart el={el as ComparisonChartTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'vocab_review')      return <VocabReview el={el as VocabReviewTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'connection_chart')  return <ConnectionChart el={el as ConnectionChartTask} responses={responses} onSave={onSave} disabled={disabled} />;
  if (el.task_type === 'rating_table')      return <RatingTable el={el as RatingTableTask} responses={responses} onSave={onSave} disabled={disabled} />;
  // Fallback: physical handout (no task_type, or unknown type)
  return <PhysicalHandout el={el} />;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>📰 {el.title}</span>
        <ListenButton text={el.instruction || ''} inline label="Listen" />
      </div>
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
              <div className="input-with-mic">
                <textarea className="form-input form-textarea" value={val} onChange={(e) => onSave(f.id, e.target.value)} onPaste={noPaste} disabled={disabled} rows={3} />
                <DictateButton currentValue={val} onResult={(v) => onSave(f.id, v)} disabled={disabled} />
              </div>
            ) : (
              <div className="input-with-mic">
                <input type="text" className="form-input" value={val} onChange={(e) => onSave(f.id, e.target.value)} onPaste={noPaste} disabled={disabled} />
                <DictateButton currentValue={val} onResult={(v) => onSave(f.id, v)} disabled={disabled} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reflection ───────────────────────────────────────────────────────────────
function Reflection({ el, responses, onSave, disabled }: { el: ReflectionElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const PICK_KEY = el.id + '_pick';
  const pickedId = (responses[PICK_KEY] ?? '') as string;

  if (el.choose_one) {
    return (
      <div className="card mb-3">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>💭 Reflection</span>
          <ListenButton text={el.instruction || ''} inline label="Listen" />
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Choose ONE to answer:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {el.prompts.map((p, i) => {
            const isSelected = pickedId === p.id;
            const val = (responses[p.id] ?? '') as string;
            return (
              <div key={p.id} style={{
                border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}>
                {/* Prompt header — clickable to select */}
                <button
                  onClick={() => !disabled && onSave(PICK_KEY, p.id)}
                  disabled={disabled}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: '10px 14px', background: isSelected ? 'var(--accent-dim)' : 'var(--surface)',
                    border: 'none', cursor: disabled ? 'default' : 'pointer', textAlign: 'left',
                    borderBottom: isSelected ? '1px solid var(--accent)' : 'none',
                  }}
                >
                  <span style={{
                    flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                    border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', color: '#fff', fontWeight: 800, marginTop: 1,
                  }}>
                    {isSelected ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: '0.88rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {p.text}
                  </span>
                </button>
                {/* Textarea — only visible when selected */}
                {isSelected && (
                  <div style={{ padding: '10px 14px', background: 'var(--card)' }}>
                    <div className="input-with-mic">
                      <textarea
                        className="form-input form-textarea"
                        placeholder="Your thoughts…"
                        value={val}
                        onChange={(e) => onSave(p.id, e.target.value)}
                        onPaste={noPaste}
                        disabled={disabled}
                        rows={4}
                        autoFocus
                      />
                      <DictateButton currentValue={val} onResult={(v) => onSave(p.id, v)} disabled={disabled} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: answer all
  return (
    <div className="card mb-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>💭 Reflection</span>
        <ListenButton text={el.instruction || ''} inline label="Listen" />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      {el.prompts.map((p, i) => {
        const val = (responses[p.id] ?? '') as string;
        return (
          <div key={p.id} className="question-block">
            <div className="question-number">Reflection {i + 1}</div>
            <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ flex: 1 }}>{p.text}</span>
              <ListenButton text={p.text} inline />
            </div>
            <div className="input-with-mic">
              <textarea
                className="form-input form-textarea"
                placeholder="Your thoughts…"
                value={val}
                onChange={(e) => onSave(p.id, e.target.value)}
                onPaste={noPaste}
                disabled={disabled}
                rows={3}
              />
              <DictateButton currentValue={val} onResult={(v) => onSave(p.id, v)} disabled={disabled} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Source Analysis ──────────────────────────────────────────────────────────
function SourceAnalysis({ el, responses, onSave, disabled }: { el: SourceAnalysisElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const termOptions = getSubmittedGlossaryTerms(undefined, responses);
  const tagsKey = `${el.id}_tags`;
  const [tagInput, setTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const savedTags = (responses[tagsKey] as string) || '';
  const currentTags = savedTags.split(',').filter(Boolean);

  const addTag = (term: string) => {
     if (!term) return;
     if (!currentTags.includes(term)) {
       const newTags = [...currentTags, term];
       onSave(tagsKey, newTags.join(','));
     }
     setTagInput('');
  };

  const removeTag = (term: string) => {
     const newTags = currentTags.filter(t => t !== term);
     onSave(tagsKey, newTags.join(','));
  };

  const hasMedia = !!(el.image || el.image_path || el.iframe_path || el.source_text);

  return (
    <div className="card mb-3" style={{ position: 'relative', overflow: 'visible' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isExpanded ? '1fr' : (hasMedia ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr'),
        gap: hasMedia ? '32px' : '0px',
        alignItems: 'start'
      }}>
        <div style={{
            position: 'sticky', top: 16, zIndex: 10, background: 'var(--card)', 
            paddingBottom: !hasMedia ? 16 : 0, 
            borderBottom: !hasMedia ? '1px solid var(--border)' : 'none', 
            marginBottom: !hasMedia ? 16 : 0,
            margin: !hasMedia ? '-24px -24px 16px -24px' : 0, 
            padding: !hasMedia ? '24px 24px 16px 24px' : 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>🔍 {el.title}</span>
              <ListenButton text={[el.context, el.instruction, el.source_text].filter(Boolean).join('. ')} inline label="Listen" />
            </div>
            {hasMedia && (
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '4px 10px', height: 'auto', minHeight: 'auto', flexShrink: 0, marginLeft: 16 }}
              >
                {isExpanded ? '↙ Shrink View' : '↗ Expand View'}
              </button>
            )}
          </div>
          {el.context && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 10, fontStyle: 'italic' }}>{el.context}</div>}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

          {/* Embedded text source */}
          {el.source_text && (
            <div style={{ padding: '16px', background: 'var(--surface-raised)', borderRadius: 'var(--radius-sm)', borderLeft: '4px solid var(--accent)', marginBottom: 20, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
              "{el.source_text}"
            </div>
          )}

          {/* Embedded image (e.g. graph or cartoon) */}
          {(el.image || el.image_path) && (
            <div style={{ marginBottom: 20, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => setIsExpanded(!isExpanded)}>
              <img
                src={el.image || el.image_path}
                alt={el.title}
                style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: isExpanded ? '85vh' : 480, background: '#fff', transition: 'max-height 0.2s ease-out' }}
              />
            </div>
          )}

          {/* Embedded iframe (e.g. custom HTML graphics) */}
          {el.iframe_path && (
            <div style={{
              marginBottom: 20,
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              height: isExpanded ? '85vh' : (el.iframe_height || 600),
              transition: 'height 0.2s ease-out',
            }}>
              <iframe
                src={el.iframe_path}
                title={el.title}
                scrolling="auto"
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  display: 'block',
                  overscrollBehavior: 'contain',
                } as React.CSSProperties}
              />
            </div>
          )}

          {/* Render tags */}
          {el.enable_tags && currentTags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {currentTags.map(tag => (
                <div key={tag} className="badge badge-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.85rem' }}>
                  {tag} 
                  {!disabled && <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>×</button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {el.choose_count ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Choose {el.choose_count} to answer:
              </div>
              {el.questions?.map((q, qi) => {
                const pickKey = `${el.id}_pick_${q.id}`;
                const isSelected = responses[pickKey] === '1';
                const pickedCount = el.questions!.filter(question => responses[`${el.id}_pick_${question.id}`] === '1').length;
                
                return (
                  <div key={q.id} style={{
                    border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s',
                  }}>
                    <button
                      onClick={() => {
                        if (disabled) return;
                        if (isSelected) onSave(pickKey, '');
                        else if (pickedCount < el.choose_count!) onSave(pickKey, '1');
                      }}
                      disabled={disabled}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px', background: isSelected ? 'var(--accent-dim)' : 'var(--surface)',
                        border: 'none', cursor: (disabled || (!isSelected && pickedCount >= el.choose_count!)) ? 'not-allowed' : 'pointer', textAlign: 'left',
                        borderBottom: isSelected ? '1px solid var(--accent)' : 'none',
                        opacity: (!isSelected && pickedCount >= el.choose_count!) ? 0.5 : 1
                      }}
                    >
                      <span style={{
                        flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', color: '#fff', fontWeight: 800, marginTop: 1,
                      }}>
                        {isSelected ? '✓' : qi + 1}
                      </span>
                      <span style={{ fontSize: '0.88rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {q.text}
                      </span>
                    </button>
                    {isSelected && (
                      <div style={{ padding: '14px', background: 'var(--card)' }}>
                        <QuestionBlock
                          question={q}
                          index={qi}
                          value={responses[q.id] ?? ''}
                          onChange={(v) => onSave(q.id, v)}
                          allResponses={responses}
                          onSaveFlag={saveFlag(onSave)}
                          disabled={disabled}
                          hidePrompt={true}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {el.questions?.map((q, qi) => (
                <React.Fragment key={q.id}>
                  <QuestionBlock
                    question={q}
                    index={qi}
                    value={responses[q.id] ?? ''}
                    onChange={(v) => onSave(q.id, v)}
                    allResponses={responses}
                    onSaveFlag={saveFlag(onSave)}
                    disabled={disabled}
                  />
                  {el.enable_tags && qi === 0 && !disabled && (
                    <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 'var(--radius)', border: '1px dashed var(--border)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>Select key terms from your glossary to tag this source:</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select className="form-input" value={tagInput} onChange={(e) => setTagInput(e.target.value)} style={{ flex: 1 }}>
                           <option value="" disabled hidden>Select a term...</option>
                           {termOptions.filter(t => !currentTags.includes(t.term)).map(opt => (
                             <option key={opt.id} value={opt.term}>{opt.term}</option>
                           ))}
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={() => addTag(tagInput)} disabled={!tagInput}>Add Tag</button>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>🗺 {el.title}</span>
        <ListenButton text={el.instruction || ''} inline label="Listen" />
      </div>
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

      {/* Assignment intro (Written Assignment Planning) */}
      {el.assignment_intro && (
        <div style={{
          background: 'var(--accent-dim)', border: '1px solid var(--accent)',
          borderRadius: 'var(--radius)', padding: '16px 20px', marginBottom: 16,
        }}>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-light)', marginBottom: 10, lineHeight: 1.5 }}>
            {el.assignment_intro.question}
          </div>
          {el.assignment_intro.requirements && (
            <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {el.assignment_intro.requirements.map((r: string, i: number) => (
                <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Planning fields (Written Assignment Planning) */}
      {el.planning_fields && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {el.planning_fields.map((field: { id: string; label: string; type: string; options?: string[]; points?: number }) => {
            const val = (responses[field.id] ?? '') as string;
            return (
              <div key={field.id}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</div>
                {field.type === 'choice' && field.options ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {field.options.map((opt: string) => {
                      const isSelected = val === opt;
                      return (
                        <button key={opt} onClick={() => onSave(field.id, opt)} disabled={disabled}
                          style={{
                            padding: '8px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 700,
                            fontSize: '0.82rem', cursor: disabled ? 'not-allowed' : 'pointer',
                            background: isSelected ? 'var(--accent)' : 'var(--surface)',
                            color: isSelected ? '#fff' : 'var(--text-muted)',
                            border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                            transition: 'all 0.15s',
                          }}>{opt}</button>
                      );
                    })}
                  </div>
                ) : field.type === 'text_area' ? (
                  <div className="input-with-mic">
                    <textarea className="form-input form-textarea" value={val}
                      onChange={(e) => onSave(field.id, e.target.value)}
                      onPaste={noPaste} disabled={disabled} rows={3} />
                    <DictateButton currentValue={val} onResult={(v) => onSave(field.id, v)} disabled={disabled} />
                  </div>
                ) : (
                  <div className="input-with-mic">
                    <input type="text" className="form-input" value={val}
                      onChange={(e) => onSave(field.id, e.target.value)}
                      onPaste={noPaste} disabled={disabled} placeholder="…" style={{ fontSize: '0.88rem' }} />
                    <DictateButton currentValue={val} onResult={(v) => onSave(field.id, v)} disabled={disabled} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Ranking simulation profiles (Immigration Minister's Dilemma etc.) */}
      {el.profiles && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {el.profiles.map((profile: { id: string; label: string; description: string }) => {
            const key = `${el.id}_rank_${profile.id}`;
            const val = (responses[key] ?? '') as string;
            const totalProfiles = el.profiles!.length;
            return (
              <div key={profile.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '12px 16px',
              }}>
                <select
                  className="form-input"
                  value={val}
                  onChange={(e) => onSave(key, e.target.value)}
                  disabled={disabled}
                  style={{ width: 60, flexShrink: 0, fontSize: '0.9rem', fontWeight: 700, textAlign: 'center' }}
                >
                  <option value="">—</option>
                  {Array.from({ length: totalProfiles }, (_, i) => (
                    <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                  ))}
                </select>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-light)', fontSize: '0.88rem', marginBottom: 4 }}>
                    Applicant {profile.label}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {profile.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Follow-up questions (used by ranking_simulation etc.) */}
      {el.follow_up_questions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {el.follow_up_questions.map((q, qi) => (
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
      )}

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
      {/* Budget allocation */}
      {el.task_type === 'budget_allocation' && el.options && el.total && (() => {
        const total = el.total;
        const allocated = el.options.reduce((sum, opt) => {
          const raw = responses[opt.id];
          return sum + (raw ? parseInt(raw as string, 10) || 0 : 0);
        }, 0);
        const remaining = total - allocated;
        const pct = Math.min(100, (allocated / total) * 100);
        const isExact = allocated === total;
        const isOver = allocated > total;

        return (
          <div>
            {/* Running total bar */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Allocated: ${allocated.toLocaleString()} / ${total.toLocaleString()}
                </span>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700,
                  color: isExact ? 'var(--success)' : isOver ? 'var(--danger)' : 'var(--amber)',
                }}>
                  {isExact ? '✓ Exactly $10M' : isOver ? `$${(allocated - total).toLocaleString()} over` : `$${remaining.toLocaleString()} remaining`}
                </span>
              </div>
              <div style={{ background: 'var(--surface)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 6, transition: 'width 0.2s, background 0.2s',
                  width: `${pct}%`,
                  background: isExact ? 'var(--success)' : isOver ? 'var(--danger)' : 'var(--accent)',
                }} />
              </div>
            </div>

            {/* Category inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {el.options.map((opt) => {
                const val = (responses[opt.id] ?? '') as string;
                return (
                  <div key={opt.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  }}>
                    <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{opt.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>$</span>
                      <input
                        type="number"
                        min={0}
                        max={total}
                        step={100000}
                        className="form-input"
                        value={val}
                        placeholder="0"
                        onChange={(e) => onSave(opt.id, e.target.value)}
                        disabled={disabled}
                        style={{ width: 130, fontSize: '0.88rem', padding: '6px 10px', textAlign: 'right' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Inline table for table_with_followup activities (columns/rows directly on element) */}
      {el.task_type === 'table_with_followup' && el.columns && el.rows && (() => {
        const key = `${el.id}_table`;
        const rawVal = responses[key];
        const rows: string[][] = rawVal && typeof rawVal === 'string'
          ? JSON.parse(rawVal)
          : Array.from({ length: el.rows }, () => (el.columns as string[]).map(() => ''));

        const updateCell = (ri: number, ci: number, v: string) => {
          const next = rows.map((r, ri2) => ri2 === ri ? r.map((c, ci2) => ci2 === ci ? v : c) : r);
          onSave(key, JSON.stringify(next));
        };

        return (
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  {el.columns.map((col) => (
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
      })()}

      {/* Questions (activity-level, e.g. ranking_simulation follow-ups) */}
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

      {/* Follow-up questions (table_with_followup) */}
      {el.follow_up_questions?.map((q, qi) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--amber)' }}>🚩 {el.title}</span>
        <ListenButton text={[el.instruction, ...el.talking_points].join('. ')} inline label="Listen" />
      </div>
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

// ─── Context Block ────────────────────────────────────────────────────────────
function ContextBlock({ el, responses, onSave, disabled }: { el: ContextElement; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>ℹ️ {el.title}</span>
        <ListenButton text={el.content || ''} inline label="Listen" />
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: el.questions?.length ? 16 : 0, whiteSpace: 'pre-wrap' }}>
        {el.content}
      </div>
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

// ─── Matching Task ────────────────────────────────────────────────────────────
function Matching({ el, responses, onSave, disabled }: { el: MatchingTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const lockKey = `${el.id}_matching_locked`;
  const [checked, setChecked] = useState(responses[lockKey] === '1');
  const allAnswered = el.items.every((item) => responses[item.id]);

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🔗 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {el.items.map((item, i) => {
          const val = (responses[item.id] ?? '') as string;
          const isCorrect = checked ? val === item.definition : null;
          return (
            <div key={item.id} style={{
              display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
              padding: '10px 14px', borderRadius: 'var(--radius-sm)',
              background: checked ? (isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)') : 'var(--surface)',
              border: `1.5px solid ${checked ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
            }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', minWidth: 150 }}>
                {i + 1}. {item.term}
              </div>
              <div style={{ flex: 2, minWidth: 200, display: 'flex', gap: 8, alignItems: 'center' }}>
                <select 
                  className="form-input" 
                  value={val} 
                  onChange={(e) => onSave(item.id, e.target.value)} 
                  disabled={disabled || checked}
                  style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                >
                  <option value="">Select definition...</option>
                  {[...el.items].sort((a,b) => a.definition.localeCompare(b.definition)).map(opt => (
                    <option key={opt.id} value={opt.definition}>{opt.definition}</option>
                  ))}
                </select>
                {checked && (
                  <span style={{ fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!checked && allAnswered && !disabled && (
        <button className="btn btn-primary btn-sm mt-3" onClick={() => { setChecked(true); onSave(lockKey, '1'); }}>Check Matches</button>
      )}
      {checked && (
        <div style={{ marginTop: 10, fontWeight: 700, fontSize: '0.85rem', color: 'var(--success)' }}>
          {el.items.filter((i) => responses[i.id] === i.definition).length}/{el.items.length} correct
        </div>
      )}
    </div>
  );
}

// ─── Rating Scale Task ────────────────────────────────────────────────────────
function RatingScale({ el, responses, onSave, disabled }: { el: RatingScaleTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>⚖️ {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: el.follow_up ? 16 : 0 }}>
        {el.items.map((item, i) => {
          const val = (responses[item.id] ?? '') as string;
          return (
            <div key={item.id} style={{
              background: 'var(--surface)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)'
            }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                {i + 1}. {item.text}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[1, 2, 3, 4, 5].map((rating) => {
                  const numStr = rating.toString();
                  const isSelected = val === numStr;
                  return (
                    <button
                      key={rating}
                      onClick={() => onSave(item.id, numStr)}
                      disabled={disabled}
                      style={{
                        flex: 1, padding: '6px 0', minWidth: 40,
                        background: isSelected ? 'var(--accent)' : 'var(--card)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {rating}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {el.follow_up && (
        <div className="question-block">
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea
              className="form-input form-textarea"
              value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)}
              onPaste={noPaste}
              disabled={disabled}
              rows={3}
            />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Ranking Task ─────────────────────────────────────────────────────────────
function Ranking({ el, responses, onSave, disabled }: { el: RankingTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🔢 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {el.items.map((item) => {
          const val = (responses[item.id] ?? '') as string;
          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'var(--surface)', padding: '10px 14px',
              borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
            }}>
              <input
                type="number"
                min={1}
                max={el.items.length}
                className="form-input"
                value={val}
                onChange={(e) => onSave(item.id, e.target.value)}
                disabled={disabled}
                style={{ width: 64, textAlign: 'center', fontWeight: 700, padding: '6px 10px' }}
                placeholder="#"
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.text}</span>
            </div>
          );
        })}
      </div>

      {el.follow_up && (
        <div className="question-block" style={{ marginTop: 16 }}>
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea
              className="form-input form-textarea"
              value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)}
              onPaste={noPaste}
              disabled={disabled}
              rows={3}
            />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Table Input Task ─────────────────────────────────────────────────────────
function TableInput({ el, responses, onSave, disabled }: { el: TableTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const key = `${el.id}_table`;
  const rawVal = responses[key];
  const tableData: string[][] = rawVal && typeof rawVal === 'string'
    ? JSON.parse(rawVal)
    : Array.from({ length: el.rows }, () => el.columns.map(() => ''));

  const updateCell = (ri: number, ci: number, v: string) => {
    const next = tableData.map((row, ri2) =>
      ri === ri2 ? row.map((cell, ci2) => ci === ci2 ? v : cell) : row
    );
    onSave(key, JSON.stringify(next));
  };

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📋 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {el.columns.map((col) => (
                <th key={col} style={{
                  padding: '8px 12px', borderBottom: '2px solid var(--border)',
                  textAlign: 'left', color: 'var(--text-muted)',
                  fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const isStaticLabel = ci === 0 && el.row_labels && el.row_labels.length > ri;
                  const dropdownOptions = el.dropdowns?.[ci];

                  return (
                    <td key={ci} style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>
                      {isStaticLabel ? (
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', padding: '6px 10px' }}>
                          {el.row_labels![ri]}
                        </div>
                      ) : dropdownOptions ? (
                        <select
                          className="form-input"
                          value={cell}
                          onChange={(e) => updateCell(ri, ci, e.target.value)}
                          disabled={disabled}
                          style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                        >
                          <option value="" disabled hidden>Select...</option>
                          {dropdownOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="form-input"
                          value={cell}
                          onChange={(e) => updateCell(ri, ci, e.target.value)}
                          onPaste={noPaste}
                          disabled={disabled}
                          style={{ fontSize: '0.85rem', padding: '6px 10px' }}
                          placeholder="..."
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {el.follow_up && (
        <div className="question-block" style={{ marginTop: 16 }}>
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea
              className="form-input form-textarea"
              value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)}
              onPaste={noPaste}
              disabled={disabled}
              rows={3}
            />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Opinion Tracker Task ─────────────────────────────────────────────────────
function OpinionTracker({ el, responses, onSave, disabled }: { el: OpinionTrackerTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🧭 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {el.items.map((item, i) => {
          const val = (responses[item.id] ?? '') as string;
          return (
            <div key={item.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px' }}>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                {i + 1}. {item.question}
              </div>
              {item.type === 'choice' && item.options && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {item.options.map((opt) => {
                    const isSelected = val === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => onSave(item.id, opt)}
                        disabled={disabled}
                        style={{
                          padding: '6px 18px',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 700, fontSize: '0.85rem',
                          background: isSelected ? 'var(--accent)' : 'var(--card)',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}
              {item.type === 'text_area' && (
                <div className="input-with-mic">
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Your thoughts…"
                    value={val}
                    onChange={(e) => onSave(item.id, e.target.value)}
                    onPaste={noPaste}
                    disabled={disabled}
                    rows={2}
                    style={{ minHeight: 52 }}
                  />
                  <DictateButton currentValue={val} onResult={(v) => onSave(item.id, v)} disabled={disabled} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Physical Handout (fallback for tasks with no task_type) ──────────────────
function PhysicalHandout({ el }: { el: TaskElement }) {
  const student = useAppStore((s) => s.currentStudent);
  const flagCheckpoint = useAppStore((s) => s.flagCheckpoint);
  const flagged = student?.flaggedForCheckpoint ?? false;

  const handleRequest = async () => {
    if (!student) return;
    await flagCheckpoint(student.id, !flagged);
  };

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📋 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 12 }}>{el.instruction}</div>
      <div style={{
        background: flagged ? 'var(--amber-dim)' : 'var(--accent-dim)',
        border: `1px solid ${flagged ? 'var(--amber)' : 'var(--accent)'}`,
        borderRadius: 'var(--radius-sm)', padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.85rem', color: flagged ? 'var(--amber)' : 'var(--accent-light)' }}>
          {flagged ? '🚩 Waiting for Mr. McRae…' : '📄 This activity uses a physical handout from Mr. McRae.'}
        </span>
        <button
          onClick={handleRequest}
          style={{
            background: flagged ? 'var(--amber)' : 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: 'var(--radius-sm)', padding: '6px 14px', fontSize: '0.82rem',
            fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          {flagged ? '✕ Cancel Request' : '✋ Ask Mr. McRae'}
        </button>
      </div>
    </div>
  );
}

// ─── Label and Select Task ────────────────────────────────────────────────────
function LabelAndSelect({ el, responses, onSave, disabled }: { el: LabelAndSelectTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const LABELS = ['PRO', 'CON'];

  const allLabelled = el.items.every((item) => responses[item.id]);
  const [checked, setChecked] = useState(false);

  const handleCheck = () => setChecked(true);

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>⚖️ {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {el.items.map((item) => {
          const val = (responses[item.id] ?? '') as string;
          const isCorrect = val === item.correct_label;
          const showResult = checked && !!val;

          return (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              background: showResult
                ? (isCorrect ? 'var(--success-dim)' : 'var(--danger-dim)')
                : 'var(--surface)',
              border: `1px solid ${showResult ? (isCorrect ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
              borderRadius: 'var(--radius-sm)', padding: '8px 12px', transition: 'all 0.2s',
            }}>
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{item.text}</span>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {LABELS.map((label) => {
                  const isSelected = val === label;
                  return (
                    <button
                      key={label}
                      onClick={() => onSave(item.id, label)}
                      disabled={disabled || checked}
                      style={{
                        padding: '4px 14px', borderRadius: 'var(--radius-sm)',
                        fontWeight: 700, fontSize: '0.78rem',
                        cursor: (disabled || checked) ? 'not-allowed' : 'pointer',
                        background: isSelected
                          ? (label === 'PRO' ? 'var(--success)' : 'var(--danger)')
                          : 'var(--card)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: `1.5px solid ${isSelected ? (label === 'PRO' ? 'var(--success)' : 'var(--danger)') : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {showResult && (
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isCorrect ? 'var(--success)' : 'var(--danger)', minWidth: 16 }}>
                  {isCorrect ? '✓' : `✗ ${item.correct_label}`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {!checked && !disabled && (
        <button
          className="btn btn-primary btn-sm mt-3"
          onClick={handleCheck}
          disabled={!allLabelled}
        >
          Check Labels
        </button>
      )}
      {checked && (
        <div style={{ marginTop: 6, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Labels checked.
          {' '}{el.items.filter((item) => responses[item.id] === item.correct_label).length}/{el.items.length} correct.
        </div>
      )}

      {el.follow_up && (
        <div className="question-block" style={{ marginTop: 16 }}>
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea
              className="form-input form-textarea"
              value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)}
              onPaste={noPaste}
              disabled={disabled}
              rows={4}
            />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Fields Form (shared by news_research & calculator_response) ──────────────
function FieldsForm({ el, responses, onSave, disabled, icon }: {
  el: NewsResearchTask | CalculatorResponseTask;
  responses: Record<string, string | string[]>;
  onSave: Props['onSave'];
  disabled?: boolean;
  icon: string;
}) {
  return (
    <div className="card mb-3">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-light)' }}>{icon} {el.title}</span>
        <ListenButton text={el.instruction || ''} inline label="Listen" />
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 2 }}>{el.instruction}</div>
      {'ai_proof_note' in el && el.ai_proof_note && (
        <div style={{ fontSize: '0.75rem', color: 'var(--amber)', marginBottom: 12, fontStyle: 'italic' }}>⚠️ {el.ai_proof_note}</div>
      )}
      {!('ai_proof_note' in el) && <div style={{ marginBottom: 12 }} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {el.fields.map((field) => {
          const val = (responses[field.id] ?? '') as string;
          return (
            <div key={field.id}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 4 }}>{field.label}</div>
              {field.type === 'text_area' ? (
                <div className="input-with-mic">
                  <textarea
                    className="form-input form-textarea"
                    value={val}
                    onChange={(e) => onSave(field.id, e.target.value)}
                    onPaste={noPaste}
                    disabled={disabled}
                    rows={3}
                  />
                  <DictateButton currentValue={val} onResult={(v) => onSave(field.id, v)} disabled={disabled} />
                </div>
              ) : (
                <div className="input-with-mic">
                  <input
                    type="text"
                    className="form-input"
                    value={val}
                    onChange={(e) => onSave(field.id, e.target.value)}
                    onPaste={noPaste}
                    disabled={disabled}
                    placeholder="…"
                    style={{ fontSize: '0.88rem' }}
                  />
                  <DictateButton currentValue={val} onResult={(v) => onSave(field.id, v)} disabled={disabled} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Comparison Chart ─────────────────────────────────────────────────────────
function ComparisonChart({ el, responses, onSave, disabled }: { el: ComparisonChartTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📊 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {el.columns.map((col) => (
                <th key={col.id} style={{
                  padding: '8px 12px', textAlign: 'center', fontWeight: 700, fontSize: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)',
                  borderBottom: '2px solid var(--border)',
                }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: el.rows }, (_, ri) => (
              <tr key={ri}>
                {el.columns.map((col) => {
                  const key = `${el.id}_${col.id}_${ri}`;
                  return (
                    <td key={col.id} style={{ padding: 6, borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                      <textarea
                        className="form-input form-textarea"
                        value={(responses[key] ?? '') as string}
                        onChange={(e) => onSave(key, e.target.value)}
                        onPaste={noPaste}
                        disabled={disabled}
                        rows={2}
                        style={{ fontSize: '0.82rem', minHeight: 48 }}
                        placeholder="…"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {el.follow_up && (
        <div className="question-block" style={{ marginTop: 14 }}>
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea className="form-input form-textarea" value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)} onPaste={noPaste} disabled={disabled} rows={3} />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Vocab Review ────────────────────────────────────────────────────────────
function VocabReview({ el, responses, onSave, disabled }: { el: VocabReviewTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  // Show ALL glossary terms from the course — not just submitted ones
  const termOptions = el.source === 'glossary'
    ? getAllGlossaryTerms()
    : [];

  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📖 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {el.columns.map((col) => (
                <th key={col} style={{
                  padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.75rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)',
                  borderBottom: '2px solid var(--border)',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: el.rows }, (_, ri) => (
              <tr key={ri}>
                {el.columns.map((_, ci) => {
                  const key = `${el.id}_r${ri}_c${ci}`;
                  const isGlossaryDrop = el.source === 'glossary' && ci === 0;

                  return (
                    <td key={ci} style={{ padding: 6, borderBottom: '1px solid var(--border)' }}>
                      {isGlossaryDrop ? (
                        <select
                          className="form-input"
                          value={(responses[key] ?? '') as string}
                          onChange={(e) => onSave(key, e.target.value)}
                          disabled={disabled}
                          style={{ fontSize: '0.85rem' }}
                        >
                          <option value="" disabled hidden>Select a term...</option>
                          {termOptions.map(opt => (
                            <option key={opt.id} value={opt.term}>{opt.term}</option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" className="form-input"
                          value={(responses[key] ?? '') as string}
                          onChange={(e) => onSave(key, e.target.value)}
                          onPaste={noPaste} disabled={disabled}
                          placeholder="…" style={{ fontSize: '0.85rem' }}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Connection Chart ────────────────────────────────────────────────────────
function ConnectionChart({ el, responses, onSave, disabled }: { el: ConnectionChartTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const colHeaders = ['Stop 1 (Starting Point)', 'Stop 2 Connection', 'Stop 3 Connection'];
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>🔗 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 14 }}>{el.instruction}</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              {colHeaders.map((h) => (
                <th key={h} style={{
                  padding: '8px 12px', textAlign: 'left', fontWeight: 700, fontSize: '0.73rem',
                  textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)',
                  borderBottom: '2px solid var(--border)', whiteSpace: 'nowrap',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {el.rows.map((row) => {
              const bKeyText = `${row.id}_b`;
              const bKeyExp = `${row.id}_b_exp`;
              const bOptions = (row.col_b_type === 'glossary_dropdown' && el.source === 'glossary') 
                ? getSubmittedGlossaryTerms(row.col_b_filter, responses) : [];
                
              const cKeyText = `${row.id}_c`;
              const cKeyExp = `${row.id}_c_exp`;
              const cOptions = (row.col_c_type === 'glossary_dropdown' && el.source === 'glossary') 
                ? getSubmittedGlossaryTerms(row.col_c_filter, responses) : [];

              return (
                <tr key={row.id}>
                  {/* Col A: fixed seed text */}
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem', verticalAlign: 'middle' }}>
                    {row.col_a}
                  </td>
                  {/* Col B */}
                  <td style={{ padding: 6, borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                    {row.col_b_type === 'glossary_dropdown' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select
                          className="form-input"
                          value={(responses[bKeyText] ?? '') as string}
                          onChange={(e) => onSave(bKeyText, e.target.value)}
                          disabled={disabled}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="" disabled hidden>Select a term...</option>
                          {bOptions.map(opt => <option key={opt.id} value={opt.term}>{opt.term}</option>)}
                        </select>
                        {row.col_b_explain && (
                          <textarea className="form-input form-textarea"
                            value={(responses[bKeyExp] ?? '') as string}
                            onChange={(e) => onSave(bKeyExp, e.target.value)}
                            onPaste={noPaste} disabled={disabled} rows={2}
                            placeholder="Explain the connection..."
                            style={{ fontSize: '0.82rem', minHeight: 40 }}
                          />
                        )}
                      </div>
                    ) : (
                      <textarea className="form-input form-textarea"
                        value={(responses[bKeyText] ?? '') as string}
                        onChange={(e) => onSave(bKeyText, e.target.value)}
                        onPaste={noPaste} disabled={disabled} rows={2}
                        placeholder={row.col_b_placeholder ?? '…'}
                        style={{ fontSize: '0.82rem', minHeight: 48 }}
                      />
                    )}
                  </td>
                  {/* Col C */}
                  <td style={{ padding: 6, borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>
                    {row.col_c_type === 'glossary_dropdown' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <select
                          className="form-input"
                          value={(responses[cKeyText] ?? '') as string}
                          onChange={(e) => onSave(cKeyText, e.target.value)}
                          disabled={disabled}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="" disabled hidden>Select a term...</option>
                          {cOptions.map(opt => <option key={opt.id} value={opt.term}>{opt.term}</option>)}
                        </select>
                        {row.col_c_explain && (
                          <textarea className="form-input form-textarea"
                            value={(responses[cKeyExp] ?? '') as string}
                            onChange={(e) => onSave(cKeyExp, e.target.value)}
                            onPaste={noPaste} disabled={disabled} rows={2}
                            placeholder="Explain the connection..."
                            style={{ fontSize: '0.82rem', minHeight: 40 }}
                          />
                        )}
                      </div>
                    ) : (
                      <textarea className="form-input form-textarea"
                        value={(responses[cKeyText] ?? '') as string}
                        onChange={(e) => onSave(cKeyText, e.target.value)}
                        onPaste={noPaste} disabled={disabled} rows={2}
                        placeholder={row.col_c_placeholder ?? '…'}
                        style={{ fontSize: '0.82rem', minHeight: 48 }}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Rating Table ─────────────────────────────────────────────────────────────
function RatingTable({ el, responses, onSave, disabled }: { el: RatingTableTask; responses: Record<string, string | string[]>; onSave: Props['onSave']; disabled?: boolean }) {
  const { min = 1, max = 5, min_label = 'Very Low', max_label = 'Very High' } = el.scale ?? {};
  const scaleOptions = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <div className="card mb-3">
      <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 4, color: 'var(--accent-light)' }}>📈 {el.title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 6 }}>{el.instruction}</div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14, fontStyle: 'italic' }}>
        {min} = {min_label} &nbsp;·&nbsp; {max} = {max_label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {el.items.map((item) => {
          const val = (responses[`${el.id}_${item.replace(/\s+/g, '_').toLowerCase()}`] ?? '') as string;
          const key = `${el.id}_${item.replace(/\s+/g, '_').toLowerCase()}`;
          return (
            <div key={item} style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
            }}>
              <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--text-primary)', minWidth: 140 }}>{item}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {scaleOptions.map((n) => {
                  const isSelected = val === String(n);
                  return (
                    <button key={n} onClick={() => onSave(key, String(n))} disabled={disabled}
                      style={{
                        width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                        fontWeight: 700, fontSize: '0.85rem', cursor: disabled ? 'not-allowed' : 'pointer',
                        background: isSelected ? 'var(--accent)' : 'var(--card)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                        transition: 'all 0.15s',
                      }}>{n}</button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {el.follow_up && (
        <div className="question-block" style={{ marginTop: 14 }}>
          <div className="question-prompt" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flex: 1 }}>{el.follow_up.text}</span>
            <ListenButton text={el.follow_up.text} inline />
          </div>
          <div className="input-with-mic">
            <textarea className="form-input form-textarea" value={(responses[el.follow_up.id] ?? '') as string}
              onChange={(e) => onSave(el.follow_up!.id, e.target.value)} onPaste={noPaste} disabled={disabled} rows={3} />
            <DictateButton currentValue={(responses[el.follow_up.id] ?? '') as string} onResult={(v) => onSave(el.follow_up!.id, v)} disabled={disabled} />
          </div>
        </div>
      )}
    </div>
  );
}
