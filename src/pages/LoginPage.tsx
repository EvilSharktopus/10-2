import React, { useState } from 'react';
import { STUDENT_ROSTER } from '../data/students';
import { getStudent, getClassConfig } from '../firebase/db';
import { useAppStore } from '../store/useAppStore';

type Step = 'code' | 'select' | 'password' | 'teacher-password';

export function LoginPage() {
  const setAuth = useAppStore((s) => s.setAuth);
  const courseId = useAppStore((s) => s.courseId);
  const [step, setStep] = useState<Step>('code');
  const [classCode, setClassCode] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [password, setPassword] = useState('');
  const [teacherPw, setTeacherPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const noPaste = (e: React.ClipboardEvent) => e.preventDefault();

  // Step 1: validate class code
  const handleCodeSubmit = async () => {
    setError('');
    const code = classCode.trim().toLowerCase();
    const envCode = (import.meta.env.VITE_CLASS_CODE ?? 'socials102').toLowerCase();
    if (code !== envCode) {
      setError('Incorrect class code. Check with your teacher.');
      return;
    }
    setStep('select');
  };

  // Step 2: student selected name
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPassword('');
    setError('');
    setStep('password');
  };

  // Step 3: student password
  const handlePasswordSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const student = await getStudent(courseId, selectedId);
      if (!student) {
        setError('Student record not found. Please contact your teacher.');
        setLoading(false);
        return;
      }
      if (password !== student.password) {
        setError('Incorrect password. Try again or ask your teacher.');
        setLoading(false);
        return;
      }
      setAuth({ studentId: selectedId, isTeacher: false });
    } catch {
      setError('Connection error. Please refresh and try again.');
    }
    setLoading(false);
  };

  // Teacher login
  const handleTeacherSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const config = await getClassConfig(courseId);
      const envTeacher = import.meta.env.VITE_TEACHER_CODE ?? 'teacher102';
      const valid =
        teacherPw === (config?.teacherPassword ?? envTeacher) ||
        teacherPw === envTeacher;
      if (!valid) {
        setError('Incorrect teacher password.');
        setLoading(false);
        return;
      }
      setAuth({ studentId: null, isTeacher: true });
    } catch {
      setError('Connection error. Please refresh and try again.');
    }
    setLoading(false);
  };

  const selectedName = STUDENT_ROSTER.find((s) => s.id === selectedId)?.shortName ?? '';

  return (
    <div className="login-page">
      <div className="login-bg-glow" />

      <div className="login-card">
        <div className="login-logo">
          <h1>Social Studies 10-2</h1>
          <p>Self-Paced Learning Workbook</p>
        </div>

        {/* Step indicator */}
        {step !== 'teacher-password' && (
          <div className="login-step-indicator">
            {(['code', 'select', 'password'] as Step[]).map((s, i) => (
              <div
                key={s}
                className={`login-step-dot${step === s ? ' active' : (['code', 'select', 'password'].indexOf(step) > i ? ' done' : '')}`}
              />
            ))}
          </div>
        )}

        {error && <div className="login-error">{error}</div>}

        {/* Step 1: Class code */}
        {step === 'code' && (
          <div className="fade-in">
            <div className="form-group">
              <label className="form-label">Class Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter the class code…"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                onPaste={noPaste}
                onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleCodeSubmit}
              disabled={!classCode.trim()}
            >
              Continue →
            </button>
            <div className="divider" />
            <button
              className="btn btn-ghost btn-full btn-sm"
              onClick={() => { setStep('teacher-password'); setError(''); }}
            >
              Teacher Access
            </button>
          </div>
        )}

        {/* Step 2: Name selection */}
        {step === 'select' && (
          <div className="fade-in">
            <button className="back-btn" onClick={() => { setStep('code'); setError(''); }}>
              ← Back
            </button>
            <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>Select your name:</p>
            <div className="student-grid">
              {STUDENT_ROSTER.map((s) => (
                <button
                  key={s.id}
                  className={`student-grid-btn${selectedId === s.id ? ' selected' : ''}`}
                  onClick={() => handleSelect(s.id)}
                >
                  {s.shortName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Password */}
        {step === 'password' && (
          <div className="fade-in">
            <button className="back-btn" onClick={() => { setStep('select'); setError(''); }}>
              ← Back
            </button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Hi, {selectedName}!
              </div>
              <div className="text-muted text-sm mt-1">Enter your password to continue.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Your password…"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onPaste={noPaste}
                onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handlePasswordSubmit}
              disabled={!password || loading}
            >
              {loading ? <span className="spinner spinner-sm" /> : 'Sign In →'}
            </button>
          </div>
        )}

        {/* Teacher password */}
        {step === 'teacher-password' && (
          <div className="fade-in">
            <button className="back-btn" onClick={() => { setStep('code'); setError(''); }}>
              ← Back
            </button>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Teacher Access</div>
              <div className="text-muted text-sm mt-1">Enter the teacher password.</div>
            </div>
            <div className="form-group">
              <label className="form-label">Teacher Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="Teacher password…"
                value={teacherPw}
                onChange={(e) => setTeacherPw(e.target.value)}
                onPaste={noPaste}
                onKeyDown={(e) => e.key === 'Enter' && handleTeacherSubmit()}
                autoFocus
              />
            </div>
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handleTeacherSubmit}
              disabled={!teacherPw || loading}
            >
              {loading ? <span className="spinner spinner-sm" /> : 'Enter Dashboard →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
