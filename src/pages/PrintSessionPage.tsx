import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStops } from '../data/stops';
import type { StopElement } from '../types';

export function PrintSessionPage() {
  const { courseId, sessionId } = useParams<{ courseId: string; sessionId: string }>();
  const navigate = useNavigate();

  const session = useMemo(() => {
    if (!courseId || !sessionId) return null;
    const stops = getStops(courseId);
    for (const stop of stops) {
      for (const s of stop.sessions) {
        if (s.id === sessionId) {
          return s;
        }
      }
    }
    return null;
  }, [courseId, sessionId]);

  useEffect(() => {
    // Automatically open print dialog when ready (give images a moment to load if any)
    if (session) {
      const timer = setTimeout(() => {
        window.print();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [session]);

  if (!session) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h2>Session not found</h2>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const renderElement = (el: StopElement, index: number) => {
    switch (el.type) {
      case 'hook':
        return (
          <div key={index} style={{ marginBottom: 20 }}>
            <h3>Hook</h3>
            <p>{el.content}</p>
          </div>
        );
      case 'glossary':
        return (
          <div key={index} style={{ marginBottom: 20 }}>
            <h3>Glossary</h3>
            <p>{el.instruction}</p>
            <ul>
              {el.terms.map((t, i) => (
                <li key={i}><strong>{t.term}</strong></li>
              ))}
            </ul>
          </div>
        );
      case 'video':
        return (
          <div key={index} style={{ marginBottom: 20, padding: 15, border: '2px solid #ccc', borderRadius: 8 }}>
            <h3 style={{ margin: 0 }}>🎬 Video: {el.title}</h3>
            {el.instruction && <p><em>{el.instruction}</em></p>}
            {el.chunks.length > 0 && (
              <div style={{ marginTop: 15 }}>
                <h4>Video Questions:</h4>
                <ol>
                  {el.chunks.flatMap(c => c.questions).map((q, i) => (
                    <li key={i} style={{ marginBottom: 15 }}>
                      <strong>{q.text}</strong>
                      <div style={{ minHeight: 60, borderBottom: '1px solid #ddd', marginTop: 10 }}></div>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        );
      case 'tasks':
        return (
          <div key={index} style={{ marginBottom: 30 }}>
            <h3>{el.title}</h3>
            <p><em>{el.instruction}</em></p>
            {/* Provide space based on task type */}
            <div style={{ minHeight: 150, border: '1px dashed #ccc', borderRadius: 8, padding: 10, marginTop: 10 }}>
              <span style={{ color: '#999', fontSize: '0.8rem' }}>[ Student Workspace: {el.task_type} ]</span>
              {el.task_type === 'free_response' && 'fields' in el && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 10 }}>
                  {el.fields.map((f: any, i: number) => (
                    <div key={i}>
                      <strong>{f.label}</strong>
                      <div style={{ minHeight: f.type === 'text_area' ? 100 : 40, borderBottom: '1px solid #ddd', marginTop: 10 }}></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'reflection':
        return (
          <div key={index} style={{ marginBottom: 30 }}>
            <h3>Reflection</h3>
            <p><em>{el.instruction}</em></p>
            <ul>
              {el.prompts.map((p, i) => (
                <li key={i} style={{ marginBottom: 10 }}>{p.text}</li>
              ))}
            </ul>
            <div style={{ minHeight: 150, borderBottom: '1px solid #ddd', marginTop: 10 }}></div>
          </div>
        );
      case 'source_analysis':
        return (
          <div key={index} style={{ marginBottom: 30 }}>
            <h3>Source Analysis: {el.title}</h3>
            <p><em>{el.instruction}</em></p>
            {el.source_text && (
              <blockquote style={{ background: '#f5f5f5', padding: 15, borderLeft: '4px solid #ccc' }}>
                {el.source_text}
              </blockquote>
            )}
            {el.assignment_question && (
              <div style={{ marginTop: 20 }}>
                <strong>{el.assignment_question}</strong>
                <div style={{ minHeight: 200, borderBottom: '1px solid #ddd', marginTop: 10 }}></div>
              </div>
            )}
          </div>
        );
      case 'activity':
        return (
          <div key={index} style={{ marginBottom: 30 }}>
            <h3>Activity: {el.title}</h3>
            <p><em>{el.instruction}</em></p>
            <div style={{ minHeight: 200, border: '1px dashed #ccc', borderRadius: 8, padding: 10, marginTop: 10 }}>
              <span style={{ color: '#999', fontSize: '0.8rem' }}>[ Activity Workspace ]</span>
            </div>
          </div>
        );
      case 'context':
        return (
          <div key={index} style={{ marginBottom: 20 }}>
            <h3>{el.title}</h3>
            <div dangerouslySetInnerHTML={{ __html: el.content }} />
            {el.questions && el.questions.length > 0 && (
              <ol style={{ marginTop: 15 }}>
                {el.questions.map((q, i) => (
                  <li key={i} style={{ marginBottom: 15 }}>
                    <strong>{q.text}</strong>
                    <div style={{ minHeight: 60, borderBottom: '1px solid #ddd', marginTop: 10 }}></div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      case 'checkpoint_prep':
        return (
          <div key={index} style={{ marginBottom: 20 }}>
            <h3>{el.title}</h3>
            <p><em>{el.instruction}</em></p>
            <ul>
              {el.talking_points.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '0 auto', 
      padding: '40px 20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#000',
      background: '#fff',
      minHeight: '100vh'
    }}>
      {/* Non-printable header for navigation */}
      <div className="no-print" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between' }}>
        <button 
          onClick={() => navigate(-1)}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#eee', border: 'none', borderRadius: 4 }}
        >
          ← Back to Dashboard
        </button>
        <button 
          onClick={() => window.print()}
          style={{ padding: '8px 16px', cursor: 'pointer', background: '#000', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          🖨️ Print Now
        </button>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; margin: 0; padding: 0; }
          @page { margin: 1in; }
          h3 { page-break-after: avoid; }
          div { page-break-inside: avoid; }
        }
      `}</style>

      <div style={{ borderBottom: '2px solid #000', paddingBottom: 20, marginBottom: 30 }}>
        <h1 style={{ margin: '0 0 10px 0' }}>Session: {session.title}</h1>
        <p style={{ margin: 0, color: '#666' }}>ID: {session.id}</p>
      </div>

      <div className="print-content">
        {session.elements.map(renderElement)}
      </div>
    </div>
  );
}
