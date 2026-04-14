import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0,0,0,0.9)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '2rem',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            background: '#1a1a1a',
            padding: '2rem',
            borderRadius: '12px',
            border: '1px solid #ef4444',
            maxWidth: '600px',
            width: '100%'
          }}>
            <h2 style={{ color: '#ef4444', marginTop: 0 }}>Component Rendering Error</h2>
            <p style={{ color: '#d1d5db', lineHeight: 1.5 }}>
              A React component failed to render.
            </p>
            <div style={{
              background: '#000',
              padding: '1rem',
              borderRadius: '6px',
              fontFamily: 'monospace',
              color: '#fca5a5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              margin: '1rem 0'
            }}>
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              style={{
                background: '#ef4444',
                color: '#fff',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
