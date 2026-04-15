import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { STOPS } from '../data/stops';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { GlossaryDrawer } from '../components/layout/GlossaryDrawer';
import { StopSession } from '../components/student/StopSession';
import { isSessionUnlocked } from '../utils/unlocks';

interface Props {
  studentId: string;
}

export function StudentPage({ studentId }: Props) {
  const subscribeStudent = useAppStore((s) => s.subscribeStudent);
  const subscribeSessionUnlocks = useAppStore((s) => s.subscribeSessionUnlocks);
  const student = useAppStore((s) => s.currentStudent);
  const unlocks = useAppStore((s) => s.unlocks);
  const logout = useAppStore((s) => s.logout);
  const advanceSession = useAppStore((s) => s.advanceSession);
  const unlockStop = useAppStore((s) => s.unlockStop);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);
  const [activeStopId, setActiveStopId] = useState(1);
  const [activeSessionIndex, setActiveSessionIndex] = useState(0);

  // Real-time Firestore subscription
  useEffect(() => {
    const unsubStudent = subscribeStudent(studentId);
    const unsubUnlocks = subscribeSessionUnlocks();
    return () => {
      unsubStudent();
      unsubUnlocks();
    };
  }, [studentId, subscribeStudent, subscribeSessionUnlocks]);

  // Sync active position from student state
  useEffect(() => {
    if (student) {
      setActiveStopId(student.currentStop);
      setActiveSessionIndex(student.currentSession - 1);
    }
  }, [student?.currentStop, student?.currentSession]);

  if (!student) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading your workbook…</span>
      </div>
    );
  }

  const totalSessions = STOPS.flatMap((s) => s.sessions).length;
  const progressPercent = totalSessions > 0
    ? (student.completedSessions.length / totalSessions) * 100
    : 0;

  const activeStop = STOPS.find((s) => s.id === activeStopId) ?? STOPS[0];
  const activeSession = activeStop.sessions[activeSessionIndex] ?? activeStop.sessions[0];
  const isLastSessionOfStop = activeSessionIndex === activeStop.sessions.length - 1;
  const isLastStop = activeStop.id === STOPS[STOPS.length - 1].id;

  const showCheckpointFlag =
    student.flaggedForCheckpoint ||
    (isLastSessionOfStop && activeStop.checkpointRequired && !student.unlockedStops.includes(activeStopId + 1));

  // Navigate to a specific session
  const handleSelectSession = (stopId: number, sessionIdx: number) => {
    const stop = STOPS.find((s) => s.id === stopId);
    if (!stop) return;
    const sessionToVerify = stop.sessions[sessionIdx];
    const hasProgressAccess = student.unlockedStops.includes(stopId);
    const hasManualAccess = isSessionUnlocked(unlocks, sessionToVerify?.id, student.id);

    if (!hasProgressAccess && !hasManualAccess) return;

    setActiveStopId(stopId);
    setActiveSessionIndex(sessionIdx);
    setSidebarOpen(false);
  };

  const handleSessionComplete = async () => {

    if (!isLastSessionOfStop) {
      // Next session within same stop
      const nextIdx = activeSessionIndex + 1;
      setActiveSessionIndex(nextIdx);
      await advanceSession(student.id, activeStopId, nextIdx + 1);
    } else if (!activeStop.checkpointRequired) {
      // Last session AND no checkpoint needed — auto-advance to next stop
      const nextStopId = activeStopId + 1;
      const nextStop = STOPS.find((s) => s.id === nextStopId);
      if (nextStop) {
        await advanceSession(student.id, nextStopId, 1);
        await unlockStop(student.id, nextStopId);
        setActiveStopId(nextStopId);
        setActiveSessionIndex(0);
      }
    } else {
      // Last session of this stop — student needs teacher checkpoint to advance
      await advanceSession(student.id, activeStopId, activeStop.sessions.length);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        student={student}
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
        onSelectSession={handleSelectSession}
        activeStopId={activeStopId}
        activeSessionIndex={activeSessionIndex}
      />

      <div className="main-content">
        <TopBar
          student={student}
          onGlossaryOpen={() => setGlossaryOpen(true)}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
          onLogout={logout}
          progressPercent={progressPercent}
          showCheckpointFlag={showCheckpointFlag}
        />

        <div className="page-inner">
          {/* Locked stop warning */}
          {(!student.unlockedStops.includes(activeStopId) && !isSessionUnlocked(unlocks, activeSession?.id, student.id)) ? (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🔒</div>
              <h2>This Session is locked</h2>
              <p className="mt-2">Request a checkpoint or wait for your teacher to unlock this session.</p>
            </div>
          ) : activeSession ? (
            <StopSession
              key={`${activeStopId}-${activeSessionIndex}`}
              stop={activeStop}
              session={activeSession}
              studentId={studentId}
              existingResponses={student.responses ?? {}}
              onComplete={handleSessionComplete}
              isLastSessionOfStop={isLastSessionOfStop}
              isLastStop={isLastStop}
            />
          ) : (
            <div className="card fade-in" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
              <h2>All Done!</h2>
              <p className="mt-2">You've completed all available sessions. Great work!</p>
            </div>
          )}
        </div>
      </div>

      <GlossaryDrawer
        open={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
        student={student}
      />
    </div>
  );
}
