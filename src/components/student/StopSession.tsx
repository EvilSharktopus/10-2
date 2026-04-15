import { useState, useCallback } from 'react';
import type { Stop, Session, VideoElement } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { ElementRenderer } from './ElementRenderer';

interface Props {
  stop: Stop;
  session: Session;
  studentId: string;
  existingResponses: Record<string, string | string[]>;
  onComplete: () => void;
  isLastSessionOfStop: boolean;
  isLastStop: boolean;
}

export function StopSession({ stop, session, studentId, existingResponses, onComplete, isLastSessionOfStop, isLastStop }: Props) {
  const saveResponse = useAppStore((s) => s.saveResponse);
  const markSessionComplete = useAppStore((s) => s.markSessionComplete);
  const currentStudent = useAppStore((s) => s.currentStudent);

  const isAlreadyComplete = currentStudent?.completedSessions.includes(session.id) ?? false;

  const [responses, setResponses] = useState<Record<string, string | string[]>>(existingResponses);
  const [saving, setSaving] = useState(false);
  const [partIndex, setPartIndex] = useState(0);
  const [chunkIndex, setChunkIndex] = useState(0);

  const elements = session.elements;
  const totalParts = elements.length;
  const currentElement = elements[partIndex];
  const isLastPart = partIndex === totalParts - 1;
  const isFirstPart = partIndex === 0;

  // If current element is a video, figure out chunk info
  const isVideo = currentElement?.type === 'video';
  const videoEl = isVideo ? (currentElement as unknown as VideoElement) : null;
  const totalChunks = videoEl ? videoEl.chunks.length : 1;
  const isLastChunk = chunkIndex >= totalChunks - 1;
  const isFirstChunk = chunkIndex === 0;

  const elementLabel = (type: string) => {
    switch (type) {
      case 'hook':            return 'Intro';
      case 'glossary':        return 'Vocabulary';
      case 'video':           return 'Video';
      case 'tasks':           return 'Activity';
      case 'reflection':      return 'Reflection';
      case 'source_analysis': return 'Source Analysis';
      case 'activity':        return 'Activity';
      case 'checkpoint_prep': return 'Checkpoint';
      default:                return 'Activity';
    }
  };

  const handleSave = useCallback((key: string, value: string | string[]) => {
    setResponses((prev) => ({ ...prev, [key]: value }));
    setSaving(true);
    clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>)['__saveTimer']);
    (window as unknown as Record<string, ReturnType<typeof setTimeout>>)['__saveTimer'] = setTimeout(async () => {
      await saveResponse(studentId, key, value);
      setSaving(false);
    }, 800);
  }, [studentId, saveResponse]);

  const handleComplete = async () => {
    setSaving(true);
    await markSessionComplete(studentId, session.id);
    setSaving(false);
    onComplete();
  };

  // Single "Next" — advance chunk first, then element
  const goNext = () => {
    if (isVideo && !isLastChunk) {
      setChunkIndex((i) => i + 1);
    } else {
      setChunkIndex(0);
      setPartIndex((i) => Math.min(i + 1, totalParts - 1));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Single "Back" — go back chunk first, then element
  const goPrev = () => {
    if (isVideo && !isFirstChunk) {
      setChunkIndex((i) => i - 1);
    } else {
      // Moving to the previous element — if it's a video, jump to its last chunk
      const prevEl = elements[partIndex - 1];
      const prevIsVideo = prevEl?.type === 'video';
      const prevChunks = prevIsVideo ? (prevEl as unknown as VideoElement).chunks.length : 1;
      setChunkIndex(prevChunks - 1);
      setPartIndex((i) => Math.max(i - 1, 0));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentElement) return null;

  const nextElement = elements[partIndex + 1];
  const prevElement = elements[partIndex - 1];

  // Determine what "Next" label should say
  const nextLabel = (() => {
    if (isVideo && !isLastChunk && videoEl) {
      return videoEl.chunks[chunkIndex + 1]?.title ?? 'Next Section';
    }
    if (isLastPart) return null; // shows Complete button instead
    return elementLabel(nextElement?.type ?? '');
  })();

  // Determine what "Back" label should say
  const backLabel = (() => {
    if (isVideo && !isFirstChunk && videoEl) {
      return videoEl.chunks[chunkIndex - 1]?.title ?? 'Previous Section';
    }
    if (isFirstPart) return null; // hidden
    return elementLabel(prevElement?.type ?? '');
  })();

  const showComplete = isLastPart && (!isVideo || isLastChunk);
  const canGoBack = !isFirstPart || (isVideo && !isFirstChunk);

  return (
    <div className="slide-up">
      {/* Header */}
      <div className="session-header">
        <div className="stop-tag">Checkpoint {stop.id} — {stop.title}</div>
        <h2>{session.title}</h2>
      </div>

      {/* Progress indicator */}
      {(totalParts > 1 || totalChunks > 1) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {elements.map((el, i) => (
              <div
                key={i}
                title={elementLabel(el.type)}
                onClick={() => { setPartIndex(i); setChunkIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  width: i === partIndex ? 20 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i < partIndex
                    ? 'var(--success)'
                    : i === partIndex
                    ? 'var(--accent)'
                    : 'var(--border)',
                  transition: 'all 0.25s',
                  cursor: 'pointer',
                  transform: 'scale(1)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {elementLabel(currentElement.type)}
            {isVideo && totalChunks > 1 && ` · Section ${chunkIndex + 1} of ${totalChunks}`}
            {!isVideo && totalParts > 1 && ` · ${partIndex + 1} of ${totalParts}`}
          </span>
          {saving && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              Saving…
            </span>
          )}
        </div>
      )}

      {/* Current element — pass chunkIndex for video */}
      <ElementRenderer
        element={currentElement}
        responses={responses}
        onSave={handleSave}
        disabled={isAlreadyComplete}
        chunkIndex={chunkIndex}
      />

      {/* Single navigation bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 20,
        borderTop: '1px solid var(--border)',
      }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={goPrev}
          disabled={!canGoBack}
          style={{ opacity: canGoBack ? 1 : 0, pointerEvents: canGoBack ? 'auto' : 'none' }}
        >
          ← {backLabel ?? 'Back'}
        </button>

        {!isAlreadyComplete ? (
          showComplete ? (
            <button className="btn btn-primary" onClick={handleComplete}>
              {isLastSessionOfStop ? (isLastStop ? '✅ Finish Course' : '✅ Complete Checkpoint') : '✅ Complete Session'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={goNext}>
              Next: {nextLabel} →
            </button>
          )
        ) : (
          !showComplete ? (
            <button className="btn btn-outline btn-sm" onClick={goNext}>
              Next: {nextLabel} →
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={onComplete}>
              {isLastSessionOfStop ? (isLastStop ? 'Finish Course ✅' : 'Next Checkpoint →') : 'Continue →'}
            </button>
          )
        )}
      </div>
    </div>
  );
}

