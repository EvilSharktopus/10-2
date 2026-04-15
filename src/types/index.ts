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

export type VideoQuestionType = 'true_false' | 'fill_blank' | 'short_answer' | 'multi_select';

export interface BlankAnswer {
  position: number;
  accepted_answers: string[];
}

export interface MultiSelectOption {
  id: string;
  text: string;
}

export interface VideoQuestion {
  id: string;
  question_type: VideoQuestionType;
  text: string;
  correct_answer?: boolean;
  blanks?: BlankAnswer[];
  options?: MultiSelectOption[];
  follow_up?: VideoQuestion;
  points: number;
  scored_by: 'auto' | 'teacher' | 'none';
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

export interface MatchingItem {
  id: string;
  term: string;
  definition: string;
  points?: number;
}
export interface MatchingTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'matching';
  items: MatchingItem[];
  scored_by?: 'auto' | 'teacher';
}

export interface RatingScaleItem {
  id: string;
  text: string;
}
export interface RatingScaleFollowUp {
  id: string;
  text: string;
  points?: number;
  scored_by?: 'auto' | 'teacher';
  notify_teacher?: boolean;
}
export interface RatingScaleTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'rating_scale';
  items: RatingScaleItem[];
  follow_up?: RatingScaleFollowUp;
}

export interface RankingItem {
  id: string;
  text: string;
  correct_rank?: number;
}
export interface RankingTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'ranking';
  items: RankingItem[];
  points?: number;
  scored_by?: 'auto' | 'teacher';
  follow_up?: RatingScaleFollowUp;
}

export interface TableTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'table';
  columns: string[];
  rows: number;
  row_labels?: string[];
  dropdowns?: Record<number, string[]>;
  follow_up?: RatingScaleFollowUp;
}

export interface OpinionTrackerItem {
  id: string;
  question: string;
  type: 'choice' | 'text_area';
  options?: string[];
  points?: number;
  scored_by?: 'auto' | 'teacher' | 'none';
  notify_teacher?: boolean;
}
export interface OpinionTrackerTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'opinion_tracker';
  items: OpinionTrackerItem[];
}

export interface PhysicalHandoutTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type?: undefined;
  physical_component?: boolean;
  teacher_note?: string;
}

export interface LabelAndSelectItem {
  id: string;
  text: string;
  correct_label: string;
  points?: number;
  scored_by?: 'auto' | 'teacher';
}
export interface LabelAndSelectTask {
  type: 'tasks';
  id: string;
  title: string;
  instruction: string;
  task_type: 'label_and_select';
  items: LabelAndSelectItem[];
  follow_up?: RatingScaleFollowUp;
}

export type TaskElement = SortTask | TChartTask | TrueFalseListTask | FreeResponseTask | MatchingTask | RatingScaleTask | RankingTask | TableTask | OpinionTrackerTask | PhysicalHandoutTask | LabelAndSelectTask
  | NewsResearchTask | ComparisonChartTask | CalculatorResponseTask | VocabReviewTask | ConnectionChartTask | RatingTableTask;

// ─── Extended task types ───────────────────────────────────────────────────────
// These share the FreeResponseField structure
export interface NewsResearchField { id: string; label: string; type: 'text_input' | 'text_area'; points?: number; scored_by?: string; notify_teacher?: boolean; }
export interface NewsResearchTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'news_research'; ai_proof_note?: string; fields: NewsResearchField[]; }
export interface CalculatorResponseTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'calculator_response'; fields: NewsResearchField[]; }

export interface ComparisonChartColumn { id: string; label: string; }
export interface ComparisonChartTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'comparison_chart'; columns: ComparisonChartColumn[]; rows: number; follow_up?: RatingScaleFollowUp; }

export interface VocabReviewTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'vocab_review'; rows: number; columns: string[]; source?: 'glossary'; source_filter?: string; }

export interface ConnectionChartRow { id: string; col_a: string; col_b_placeholder?: string; col_c_placeholder?: string; col_b_type?: 'glossary_dropdown'; col_b_filter?: string; col_b_explain?: boolean; col_c_type?: 'glossary_dropdown'; col_c_filter?: string; col_c_explain?: boolean; }
export interface ConnectionChartTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'connection_chart'; source?: 'glossary'; rows: ConnectionChartRow[]; points?: number; scored_by?: string; notify_teacher?: boolean; }

export interface RatingTableScale { min: number; max: number; min_label: string; max_label: string; }
export interface RatingTableTask { type: 'tasks'; id: string; title: string; instruction: string; task_type: 'rating_table'; items: string[]; scale: RatingTableScale; follow_up?: RatingScaleFollowUp; }

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
  choose_one?: boolean;
}

export interface SourceAnalysisElement {
  type: 'source_analysis';
  id: string;
  title: string;
  instruction: string;
  assignment_question?: string;
  source_type?: 'written' | 'cartoon';
  source_text?: string;
  image_path?: string;
  context?: string;
  image?: string;
  iframe_path?: string;
  iframe_height?: number;
  questions?: VideoQuestion[];
  choose_count?: number;
  enable_tags?: boolean;
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
  task_type?: string;
  physical_component?: boolean;
  teacher_note?: string;
  fields?: ActivityField[];
  questions?: VideoQuestion[];
  // table_with_followup support
  columns?: string[];
  rows?: number;
  follow_up_questions?: VideoQuestion[];
  // budget_allocation support
  options?: { id: string; label: string }[];
  total?: number;
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

export interface ContextElement {
  type: 'context';
  id: string;
  title: string;
  content: string;
  questions?: VideoQuestion[];
}

export type StopElement =
  | HookElement
  | GlossaryElement
  | VideoElement
  | TaskElement
  | ReflectionElement
  | SourceAnalysisElement
  | ActivityElement
  | ContextElement
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
