import { useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import type { Student } from '../../types';
import stopsData from '../../data/stops-content-v4.json';

// ── Glossary helpers ───────────────────────────────────────────────────────────
interface GlossaryTerm { id: string; term: string }

const STOPS = (stopsData as any).checkpoints;

function getAllGlossaryTerms(): GlossaryTerm[] {
  const terms: GlossaryTerm[] = [];
  STOPS.forEach((stop: any) => {
    stop.sessions.forEach((session: any) => {
      session.elements.forEach((el: any) => {
        if (el.type === 'glossary' && el.terms) {
          el.terms.forEach((t: GlossaryTerm) => terms.push(t));
        }
      });
    });
  });
  return terms;
}

// ── Glossary CSV download ──────────────────────────────────────────────────────
function downloadGlossary(terms: { term: string; definition: string }[]) {
  const header = 'Term,Definition';
  const rows = terms.map(t => `"${t.term.replace(/"/g, '""')}","${t.definition.replace(/"/g, '""')}"`);
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Social_Studies_10-2_Glossary.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ──────────────────────────────────────────────────────────────────
interface Props { student: Student }

export function CourseComplete({ student }: Props) {
  // Fire confetti on mount
  useEffect(() => {
    const duration = 4000;
    const end = Date.now() + duration;

    // Initial burst
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });

    // Slow rain
    const interval = setInterval(() => {
      if (Date.now() > end) { clearInterval(interval); return; }
      confetti({
        particleCount: 3,
        angle: 60 + Math.random() * 60,
        spread: 55,
        origin: { x: Math.random(), y: -0.1 },
        colors: ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981'],
      });
    }, 80);

    return () => clearInterval(interval);
  }, []);

  // Stats
  const completedSessions = student.completedSessions?.length ?? 0;
  const totalSessions = STOPS.reduce((sum: number, cp: any) => sum + cp.sessions.length, 0);

  const allTerms = useMemo(() => getAllGlossaryTerms(), []);
  const answeredCount = Object.keys(student.responses ?? {}).length;
  const glossaryAnswered = allTerms.filter(t => {
    const val = student.responses?.[t.id];
    return typeof val === 'string' && val.trim().length > 0;
  });

  // Build glossary with definitions for download
  const glossaryForDownload = glossaryAnswered.map(t => ({
    term: t.term,
    definition: (student.responses?.[t.id] ?? '') as string,
  }));

  // Pull final position statement
  const finalStatement = (student.responses?.['fp_2'] ?? '') as string;

  return (
    <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 28px', maxWidth: 640, margin: '0 auto' }}>
      {/* Celebration header */}
      <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎓</div>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 4, background: 'linear-gradient(135deg, var(--accent), #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Congratulations, {student.shortName || student.displayName}!
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: 32 }}>
        You have completed <strong>Social Studies 10-2</strong>.
      </p>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: 12, marginBottom: 32,
      }}>
        {[
          { icon: '📅', label: 'Sessions', value: `${completedSessions}/${totalSessions}` },
          { icon: '✍️', label: 'Responses', value: String(answeredCount) },
          { icon: '📖', label: 'Glossary Terms', value: `${glossaryAnswered.length}/${allTerms.length}` },
          { icon: '🔍', label: 'Checkpoints', value: 'All Passed' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 8px',
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-light)' }}>{stat.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Final position statement */}
      {finalStatement && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '20px 24px', marginBottom: 28,
          textAlign: 'left', position: 'relative',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 10 }}>
            Your Final Position
          </div>
          <div style={{ fontSize: '2.5rem', position: 'absolute', top: 10, right: 16, opacity: 0.1, color: 'var(--accent)' }}>"</div>
          <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
            {finalStatement}
          </p>
        </div>
      )}

      {/* Glossary download */}
      <button
        onClick={() => downloadGlossary(glossaryForDownload)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: 'var(--radius-sm)', padding: '12px 24px',
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          transition: 'opacity 0.15s', marginBottom: 12,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        📥 Download My Glossary (CSV)
      </button>
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 32 }}>
        Open in Google Sheets or Excel to study for your final.
      </p>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <strong>Mr. McRae's Social Studies 10-2</strong><br />
          2025 – 2026
        </div>
      </div>
    </div>
  );
}
