import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { THEMES } from '../../utils/theme';
import type { ThemeColorName } from '../../utils/theme';

export function ColorThemePicker() {
  const themeColor = useAppStore(s => s.themeColor);
  const setThemeColor = useAppStore(s => s.setThemeColor);
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentTheme = THEMES[themeColor] || THEMES.purple;

  return (
    <div style={{ position: 'relative' }} ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 28, height: 28,
          borderRadius: '50%',
          background: currentTheme.accent,
          border: '2px solid rgba(255,255,255,0.8)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s ease'
        }}
        title="Customize Theme"
      >
        <span style={{ fontSize: '0.7rem', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}>🎨</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%', right: 0,
          marginTop: 10,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 12,
          display: 'flex',
          gap: 10,
          boxShadow: 'var(--shadow)',
          zIndex: 200,
          animation: 'fade-in 0.15s ease'
        }}>
          {(Object.keys(THEMES) as ThemeColorName[]).map(key => {
            const isSelected = key === themeColor;
            return (
              <button
                key={key}
                onClick={() => {
                  setThemeColor(key);
                  setIsOpen(false);
                }}
                style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: THEMES[key].accent,
                  border: isSelected ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  padding: 0,
                  transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 0 10px var(--accent)' : 'none'
                }}
                title={`Theme: ${key}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
