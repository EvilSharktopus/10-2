// ─── Runtime Types (auth, student state) ─────────────────────────────────────

export interface Student {
  id: string;
  displayName: string;
  shortName: string;
  password: string;
  currentStop: number;
  currentSession: number;
  flaggedForCheckpoint: boolean;
  unlockedStops: number[];
  completedSessions: string[];
  glossaryUnlocked: string[];
  responses: Record<string, string | string[]>;
  lastSeen: number;
}

export interface ClassConfig {
  classCode: string;
  teacherPassword: string;
  initialized: boolean;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  unlockedAfterStop: number;
}

export interface AuthSession {
  studentId: string | null;
  isTeacher: boolean;
}

// ─── Content Element Types ────────────────────────────────────────────────────

export interface HookElement {
  type: 'hook';
  id: string;
  content: string;
}

export interface GlossaryTerm2 {
  id: string;
  term: string;
}
export interface GlossaryElement {
  type: 'glossary';
  id: string;
  instruction: string;
  terms: GlossaryTerm2[];
}

export type VideoQuestionType = 'true_false' | 'fill_blank' | 'short_answer';

export interface BlankAnswer {
  position: number;
  accepted_answers: string[];
}

export interface VideoQuestion {
  id: string;
  question_type: VideoQuestionType;
  text: string;
  correct_answer?: boolean;
  blanks?: BlankAnswer[];
  points: number;
  scored_by: 'auto' | 'teacher';
  notify_teacher?: boolean;
}

export interface VideoChunk {
  id: string;
  title: string;
  start_seconds: number;
  end_seconds: number;
  questions: VideoQuestion[];
}

export interface VideoElement {
  type: 'video';
  id: string;
  title: string;
  youtube_id: string;
  chunks: VideoChunk[];
}

// Tasks
export interface SortItem {
  id: string;
  text: string;
  correct_column: string;
}
export interface SortTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'sort';
  items: SortItem[];
  columns: { id: string; label: string }[];
  points: number;
  scored_by: 'auto' | 'teacher';
}

export interface TChartTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'tchart';
  columns: { id: string; label: string }[];
  min_per_column: number;
  points: number;
  scored_by: 'auto' | 'teacher';
  notify_teacher?: boolean;
}

export interface TrueFalseListItem {
  id: string;
  text: string;
  correct_answer: boolean;
  points: number;
  scored_by: 'auto' | 'teacher';
}
export interface TrueFalseListTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'true_false_list';
  items: TrueFalseListItem[];
}

export interface FreeResponseField {
  id: string;
  label: string;
  type: 'text_input' | 'text_area' | 'table';
  points?: number;
  scored_by?: 'auto' | 'teacher';
  notify_teacher?: boolean;
  columns?: string[];
  rows?: number;
}
export interface FreeResponseTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'free_response';
  ai_proof_note?: string;
  fields: FreeResponseField[];
}

export type TaskElement = SortTask | TChartTask | TrueFalseListTask | FreeResponseTask;

export interface ReflectionPrompt {
  id: string;
  text: string;
  points: number;
  scored_by: 'auto' | 'teacher';
}
export interface ReflectionElement {
  type: 'reflection';
  id: string;
  instruction: string;
  prompts: ReflectionPrompt[];
}

export interface SourceAnalysisStep {
  step: number;
  label: string;
  active: boolean;
  questions?: VideoQuestion[];
}
export interface SourceAnalysisElement {
  type: 'source_analysis';
  id: string;
  title: string;
  instruction: string;
  context?: string;
  steps: SourceAnalysisStep[];
}

export interface ActivityField {
  id: string;
  type: 'table';
  columns: string[];
  rows: number;
}
export interface ActivityElement {
  type: 'activity';
  id: string;
  title: string;
  instruction: string;
  physical_component?: boolean;
  teacher_note?: string;
  fields?: ActivityField[];
  questions?: VideoQuestion[];
}

export interface CheckpointPrepElement {
  type: 'checkpoint_prep';
  id: string;
  checkpoint_id: string;
  title: string;
  instruction: string;
  talking_points: string[];
  locks_next_stop: boolean;
  lock_message: string;
}

export type StopElement =
  | HookElement
  | GlossaryElement
  | VideoElement
  | TaskElement
  | ReflectionElement
  | SourceAnalysisElement
  | ActivityElement
  | CheckpointPrepElement;

// ─── Stop / Session ──────────────────────────────────────────────────────────

export interface Session {
  id: string;
  title: string;
  special_unlock?: boolean;
  elements: StopElement[];
}

export interface Stop {
  id: number;
  title: string;
  description?: string;
  outcomes: string[];
  sessions: Session[];
  checkpointRequired: boolean;
}

// ─── Session Unlocks ──────────────────────────────────────────────────────────

export interface UnlockRecord {
  sessionId: string;
  unlockedAt: number | null; // using ms timestamp for simpler sync
  unlockedBy: string;
  scope: 'all' | 'students';
  studentIds: string[];
}

export type UnlockMap = Record<string, UnlockRecord>;
