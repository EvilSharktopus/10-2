import type { Stop } from '../../types';
import type { Student } from '../../types';
import { STOPS } from '../../data/stops';
import { useAppStore } from '../../store/useAppStore';
import { isSessionUnlocked } from '../../utils/unlocks';

interface Props {
  student: Student;
  sidebarOpen: boolean;
  onToggle: () => void;
  onSelectSession: (stopId: number, sessionIndex: number) => void;
  activeStopId: number;
  activeSessionIndex: number;
}

export function Sidebar({
  student,
  sidebarOpen,
  onToggle,
  onSelectSession,
  activeStopId,
  activeSessionIndex,
}: Props) {
  const unlocks = useAppStore((s) => s.unlocks);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
        onClick={onToggle}
      />

      <nav className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <span>Social Studies 10-2</span>
          <h2>Learning Checkpoints</h2>
        </div>

        <div className="sidebar-stops">
          {STOPS.map((stop: Stop) => {
            const hasProgressAccess = student.unlockedStops.includes(stop.id);
            const isCompleted = stop.sessions.every((s) =>
              student.completedSessions.includes(s.id)
            );
            const isActive = stop.id === activeStopId;

            // Check if ANY session in this stop is manually unlocked for this student
            const anySessionManuallyUnlocked = stop.sessions.some((s) =>
              isSessionUnlocked(unlocks, s.id, student.id)
            );

            const isLocked = !hasProgressAccess && !anySessionManuallyUnlocked;
            const isAccessible = hasProgressAccess || anySessionManuallyUnlocked;

            let statusClass = '';
            if (isLocked) statusClass = 'locked';
            else if (isCompleted) statusClass = 'completed';
            else if (isActive) statusClass = 'active';

            let iconClass = '';
            if (isActive && !isCompleted) iconClass = 'active';
            else if (isCompleted) iconClass = 'completed';
            else if (isLocked) iconClass = 'locked';

            return (
              <div key={stop.id}>
                {/* Stop header */}
                <div
                  className={`sidebar-stop-item ${statusClass}`}
                  onClick={() => {
                    // Find the first accessible session index to navigate to
                    if (isAccessible) {
                      const firstUnlockedIdx = stop.sessions.findIndex((s) =>
                        hasProgressAccess || isSessionUnlocked(unlocks, s.id, student.id)
                      );
                      onSelectSession(stop.id, Math.max(0, firstUnlockedIdx));
                    }
                  }}
                >
                  <div className={`stop-icon ${iconClass}`}>
                    {isLocked ? '🔒' : isCompleted ? '✓' : stop.id}
                  </div>
                  <div className="stop-label">
                    Checkpoint {stop.id}
                    <small>{stop.title.split('—')[1]?.trim() ?? stop.title}</small>
                  </div>
                </div>

                {/* Sessions — show when this stop is active OR has any manual unlocks */}
                {(isActive || anySessionManuallyUnlocked) && isAccessible && (
                  <div style={{ paddingLeft: 16 }}>
                    {stop.sessions.map((session, si) => {
                      const sessionDone = student.completedSessions.includes(session.id);
                      const isActiveSession = isActive && si === activeSessionIndex;
                      const manuallyUnlocked = isSessionUnlocked(unlocks, session.id, student.id);
                      const sessionLocked = !hasProgressAccess && !manuallyUnlocked;

                      return (
                        <div
                          key={session.id}
                          className={`sidebar-stop-item${isActiveSession ? ' active' : ''}${sessionDone ? ' completed' : ''}${sessionLocked ? ' locked' : ''}`}
                          style={{
                            padding: '7px 12px',
                            fontSize: '0.8rem',
                            borderLeftWidth: isActiveSession ? 2 : 0,
                            cursor: sessionLocked ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => {
                            if (!sessionLocked) onSelectSession(stop.id, si);
                          }}
                        >
                          <div
                            className={`stop-icon${sessionDone ? ' completed' : isActiveSession ? ' active' : ''}${sessionLocked ? ' locked' : ''}`}
                            style={{ width: 20, height: 20, fontSize: '0.65rem' }}
                          >
                            {sessionLocked ? '🔒' : sessionDone ? '✓' : si + 1}
                          </div>
                          <span style={{ color: isActiveSession ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {session.title.split('—')[1]?.trim() ?? session.title}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sidebar-bottom">
          <div className="text-xs text-muted" style={{ textAlign: 'center' }}>
            {student.completedSessions.length} sessions completed
          </div>
        </div>
      </nav>
    </>
  );
}
