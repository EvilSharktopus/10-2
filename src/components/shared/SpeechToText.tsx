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

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  /** Current value of the text field */
  currentValue: string;
  /** Called with the updated text (existing + transcribed) */
  onResult: (newValue: string) => void;
  /** If true, button is not rendered */
  disabled?: boolean;
}

export function DictateButton({ currentValue, onResult, disabled }: Props) {
  const accessibilityMode = useAppStore(s => s.accessibilityMode);
  const SpeechRecognition = getSpeechRecognition();
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  // Capture latest value reference so the onresult callback always appends to current text
  const valueRef = useRef(currentValue);
  useEffect(() => { valueRef.current = currentValue; }, [currentValue]);

  const toggle = useCallback(() => {
    if (!SpeechRecognition) return;

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

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
      if (e.error !== 'aborted') {
        console.warn('[STT] Error:', e.error);
      }
      setListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setListening(true);
    } catch {
      console.warn('[STT] Could not start recognition.');
    }
  }, [SpeechRecognition, listening, onResult]);

  // clean up on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  // Don't render if unsupported, disabled, or accessibility off
  if (!SpeechRecognition || disabled || !accessibilityMode) return null;

  return (
    <button
      type="button"
      className={`dictate-btn${listening ? ' listening' : ''}`}
      onClick={toggle}
      title={listening ? 'Stop dictating' : 'Dictate your answer'}
      aria-label={listening ? 'Stop dictating' : 'Start dictating'}
    >
      {listening ? '⏹' : '🎤'}
    </button>
  );
}
