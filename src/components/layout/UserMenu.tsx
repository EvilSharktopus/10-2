import { useState, useRef, useEffect } from 'react';
import type { Student } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { THEMES } from '../../utils/theme';
import type { ThemeColorName } from '../../utils/theme';

interface Props {
  student: Student;
  grade: {
    autoEarned: number;
    autoAttemptedPossible: number;
    autoPercent: number;
  };
  hasAttempted: boolean;
  onLogout: () => void;
  onShowGradeModal: () => void;
}

export function UserMenu({ student, grade, hasAttempted, onLogout, onShowGradeModal }: Props) {
  const themeColor = useAppStore(s => s.themeColor);
  const setThemeColor = useAppStore(s => s.setThemeColor);
  const themeMode = useAppStore(s => s.themeMode);
  const setThemeMode = useAppStore(s => s.setThemeMode);
  
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

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

  const initial = student.shortName.charAt(0).toUpperCase();
  const pctColor = grade.autoPercent >= 75 ? 'var(--success)' : grade.autoPercent >= 50 ? 'var(--amber)' : 'var(--danger)';

  return (
    <div style={{ position: 'relative' }} ref={popupRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: 38, height: 38,
          borderRadius: '50%',
          background: 'var(--accent)',
          border: '2px solid rgba(255,255,255,0.2)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '1rem',
          cursor: 'pointer',
          padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s ease'
        }}
        title="User Menu"
      >
        {initial}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%', right: 0,
          marginTop: 10,
          width: 260,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          zIndex: 200,
          animation: 'fade-in 0.15s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{student.displayName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>Checkpoint {student.currentStop}</div>
          </div>

          {/* Grades */}
          {hasAttempted && (
            <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>My Progress</div>
              <button style={{
                width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'var(--surface)', border: `1px solid ${pctColor}`,
                borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                fontSize: '0.85rem', fontWeight: 600, color: pctColor,
                cursor: 'pointer', transition: 'background 0.15s'
              }} onClick={() => { setIsOpen(false); onShowGradeModal(); }}>
                <span>⭐ {grade.autoEarned}/{grade.autoAttemptedPossible} pts</span>
                <span style={{ opacity: 0.8 }}>{grade.autoPercent}%</span>
              </button>
            </div>
          )}

          {/* Theme Picker */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>Theme Color</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {(Object.keys(THEMES) as ThemeColorName[]).map(key => {
                const isSelected = key === themeColor;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setThemeColor(key);
                    }}
                    style={{
                      width: 24, height: 24,
                      borderRadius: '50%',
                      background: THEMES[key].accent,
                      border: isSelected ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                      padding: 0,
                      transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 0 10px var(--accent)' : 'none'
                    }}
                    title={`Theme: ${key}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Theme Mode Toggle */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dark Mode</div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setThemeMode(themeMode === 'light' ? 'dark' : 'light');
              }}
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                background: themeMode === 'light' ? 'var(--border)' : 'var(--accent)',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{
                position: 'absolute', top: 2, left: themeMode === 'light' ? 2 : 22,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }} />
            </button>
          </div>

          {/* Sign Out */}
          <div style={{ padding: '8px' }}>
            <button
              onClick={onLogout}
              style={{
                width: '100%', padding: '10px 16px', background: 'transparent',
                border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem',
                fontWeight: 500, textAlign: 'left', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
