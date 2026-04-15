import { useNavigate } from 'react-router-dom';

interface AppCard {
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  external?: boolean;
  color: string;
  glow: string;
}

const APPS: AppCard[] = [
  {
    emoji: '📚',
    title: 'SS 10-2 Workbook',
    subtitle: 'Globalization Unit',
    description: 'Self-paced digital workbook — activities, vocab, checkpoints, and feedback.',
    href: '/workbooks/10-2',
    color: '#7c5cfc',
    glow: 'rgba(124,92,252,0.25)',
  },
  {
    emoji: '🌍',
    title: 'Nationalism Game',
    subtitle: 'Simulation',
    description: 'Multi-round classroom simulation exploring nationalism, factions, and conflict.',
    href: 'https://nationalism.vercel.app',
    external: true,
    color: '#e05c5c',
    glow: 'rgba(224,92,92,0.25)',
  },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      fontFamily: 'var(--font-body)',
    }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <div style={{ fontSize: '2.8rem', marginBottom: 12 }}>🎓</div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.6rem, 4vw, 2.6rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.02em',
        }}>
          Mr. McRae's Classes
        </h1>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '1rem',
          marginTop: 8,
        }}>
          Social Studies · Select your activity
        </p>
      </div>

      {/* Cards */}
      <div style={{
        display: 'flex',
        gap: 24,
        flexWrap: 'wrap',
        justifyContent: 'center',
        maxWidth: 760,
        width: '100%',
      }}>
        {APPS.map((app) => (
          <button
            key={app.href}
            onClick={() => app.external
              ? window.open(app.href, '_blank', 'noopener')
              : navigate(app.href)
            }
            style={{
              flex: '1 1 280px',
              maxWidth: 340,
              background: 'var(--surface)',
              border: `1.5px solid var(--border)`,
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '36px 28px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
              boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(-4px)';
              el.style.boxShadow = `0 12px 40px ${app.glow}, 0 4px 24px rgba(0,0,0,0.22)`;
              el.style.borderColor = app.color;
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.transform = 'translateY(0)';
              el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.18)';
              el.style.borderColor = 'var(--border)';
            }}
          >
            {/* Glow blob */}
            <div style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: '50%',
              background: app.glow,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }} />

            <div style={{ fontSize: '2.4rem', marginBottom: 16 }}>{app.emoji}</div>

            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              marginBottom: 4,
            }}>
              {app.title}
            </div>

            <div style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: app.color,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 12,
            }}>
              {app.subtitle}
            </div>

            <div style={{
              fontSize: '0.88rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
            }}>
              {app.description}
            </div>

            <div style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem',
              fontWeight: 700,
              color: app.color,
            }}>
              Open {app.external ? '↗' : '→'}
            </div>
          </button>
        ))}
      </div>

      <div style={{
        marginTop: 48,
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        opacity: 0.5,
      }}>
        mcraesocial.com
      </div>
    </div>
  );
}
