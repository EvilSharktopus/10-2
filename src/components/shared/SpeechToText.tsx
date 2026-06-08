import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

// ── Browser SpeechRecognition polyfill type ──────────────────────────────────
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null;
}

function friendlyError(code: string): string {
  switch (code) {
    case 'not-allowed':
    case 'permission-denied':
      return 'Microphone access was blocked. Click the 🔒 icon in your address bar and allow the microphone, then try again.';
    case 'audio-capture':
      return 'No microphone found. Make sure one is plugged in and not muted.';
    case 'in-use':
      return 'Your microphone is being used by another tab or app. Close the other one and try again.';
    case 'no-speech':
      return 'No speech was detected. Speak closer to your microphone and try again.';
    case 'network':
      return 'Chrome\'s microphone uses Google\'s servers to process speech — your school network may be blocking it. Try using your phone\'s hotspot, or ask Mr. McRae for an alternative.';
    case 'aborted':
      return ''; // user-initiated stop — no message needed
    default:
      return `Microphone stopped unexpectedly (${code}). Try again or reload the page.`;
  }
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  currentValue: string;
  onResult: (newValue: string) => void;
  disabled?: boolean;
}

export function DictateButton({ currentValue, onResult, disabled }: Props) {
  const accessibilityMode = useAppStore(s => s.accessibilityMode);
  const SpeechRecognition = getSpeechRecognition();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const valueRef = useRef(currentValue);
  useEffect(() => { valueRef.current = currentValue; }, [currentValue]);

  const showError = (msg: string) => {
    if (!msg) return;
    setError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setError(''), 8000);
  };

  const toggle = useCallback(() => {
    if (!SpeechRecognition) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setError('');

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-CA';
    recognitionRef.current = recognition;

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      const current = valueRef.current;
      const separator = current && !current.endsWith(' ') ? ' ' : '';
      onResult(current + separator + transcript);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = (e) => {
      console.warn('[STT] Error:', e.error);
      showError(friendlyError(e.error));
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch (err) {
      console.warn('[STT] Could not start recognition.', err);
      showError('Could not start the microphone. Try reloading the page.');
    }
  }, [SpeechRecognition, listening, onResult]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  if (!SpeechRecognition || disabled || !accessibilityMode) return null;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <button
        type="button"
        className={`dictate-btn${listening ? ' listening' : ''}`}
        onClick={toggle}
        title={listening ? 'Stop dictating' : error ? error : 'Dictate your answer'}
        aria-label={listening ? 'Stop dictating' : 'Start dictating'}
        style={error ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}
      >
        {listening ? '⏹' : error ? '⚠️' : '🎤'}
      </button>
      {error && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: 6,
          width: 260,
          background: 'var(--danger-dim)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          fontSize: '0.78rem',
          color: 'var(--danger)',
          lineHeight: 1.5,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 50,
        }}>
          {error}
        </div>
      )}
    </div>
  );
}
