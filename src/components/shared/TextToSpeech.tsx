import { useState, useEffect, useRef, useCallback } from 'react';

interface Props {
  /** The text to read aloud */
  text: string;
  /** Optional: display as a compact inline button */
  inline?: boolean;
  /** Optional label shown next to the icon */
  label?: string;
}

const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export function ListenButton({ text, inline, label }: Props) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    utteranceRef.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (!isSupported) return;

    if (speaking) {
      stop();
      return;
    }

    // Cancel any current speech first
    window.speechSynthesis.cancel();

    const cleaned = text
      .replace(/<[^>]*>/g, '')   // strip HTML tags
      .replace(/\s+/g, ' ')      // collapse whitespace
      .trim();

    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-CA';
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setSpeaking(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [text, speaking, stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isSupported || !text) return null;

  return (
    <button
      type="button"
      className={`listen-btn${speaking ? ' speaking' : ''}${inline ? ' listen-btn-inline' : ''}`}
      onClick={toggle}
      title={speaking ? 'Stop reading' : 'Read aloud'}
      aria-label={speaking ? 'Stop reading aloud' : 'Read aloud'}
    >
      {speaking ? '⏹' : '🔊'}
      {label && <span className="listen-btn-label">{label}</span>}
    </button>
  );
}
