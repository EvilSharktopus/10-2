import { useAppStore } from '../../store/useAppStore';


interface Props {
  studentId: string;
}

export function CheckpointFlag({ studentId }: Props) {
  const student = useAppStore((s) => s.currentStudent);
  const flagCheckpoint = useAppStore((s) => s.flagCheckpoint);
  const flagged = student?.flaggedForCheckpoint ?? false;

  const handleToggle = async () => {
    await flagCheckpoint(studentId, !flagged);
  };

  return (
    <button
      className={`checkpoint-btn${flagged ? ' flagged' : ''}`}
      onClick={handleToggle}
      title={flagged ? 'Click to cancel your checkpoint request' : 'Let your teacher know you\'re ready for a checkpoint'}
    >
      <span>{flagged ? '🚩' : '✋'}</span>
      <span>{flagged ? 'Waiting for teacher…' : 'Request Checkpoint'}</span>
    </button>
  );
}
