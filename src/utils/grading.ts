import { STOPS } from '../data/stops';
import type { StopElement, VideoQuestion } from '../types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GradeItem {
  id: string;
  gradedBy: 'auto' | 'teacher';
  prompt: string;
  response: string;
  hasResponse: boolean;
  earned: number;       // auto: points earned (after override); teacher: 0 until graded
  possible: number;
  correct?: boolean;    // auto only (reflects override if present)
  elementType: string;
  overrideKey?: string; // key to look up teacher override in responses
  disputeStatus?: 'pending' | 'accepted' | 'dismissed';
  disputeNote?: string;
  feedback?: string;
}

export interface SessionGrade {
  sessionId: string;
  sessionTitle: string;
  items: GradeItem[];
}

export interface StopGrade {
  stopId: number;
  stopTitle: string;
  outcomes: string[];
  autoEarned: number;
  autoPossible: number;
  teacherPending: number;  // responses submitted but not yet teacher-graded
  sessions: SessionGrade[];
}

export interface StudentGrade {
  autoEarned: number;
  autoPossible: number;           // total possible in whole curriculum (teacher view)
  autoAttemptedPossible: number;  // possible points on questions the student actually attempted
  autoPercent: number;
  teacherPending: number;
  teacherEarned: number;          // sum of points on teacher-scored items
  teacherScored: number;          // possible points on items that have been scored (not pending)
  disputeCount: number;
  totalResponses: number;
  byStop: StopGrade[];
  byOutcome: Record<string, { earned: number; possible: number; pending: number }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function norm(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
}

function gradeAutoQ(
  q: VideoQuestion,
  val: string,
): { earned: number; possible: number; correct: boolean } {
  if (!val) return { earned: 0, possible: q.points, correct: false };

  if (q.question_type === 'true_false') {
    const isCorrect = val === (q.correct_answer ? 'True' : 'False');
    return { earned: isCorrect ? q.points : 0, possible: q.points, correct: isCorrect };
  }

  if (q.question_type === 'fill_blank' && q.blanks) {
    const parts = val.split('||');
    let ok = 0;
    q.blanks.forEach((b, i) => {
      if (b.accepted_answers.some((a) => norm(a) === norm(parts[i] ?? ''))) ok++;
    });
    const ratio = ok / q.blanks.length;
    return {
      earned: Math.round(ratio * q.points),
      possible: q.points,
      correct: ratio === 1,
    };
  }

  return { earned: 0, possible: q.points, correct: false };
}

function str(val: string | string[] | undefined): string {
  if (!val) return '';
  return Array.isArray(val) ? val.filter(Boolean).join(', ') : val;
}

function hasVal(val: string | string[] | undefined): boolean {
  if (!val) return false;
  if (Array.isArray(val)) return val.some((v) => v && v.trim());
  return val.trim().length > 0;
}

// ─── Element extraction ───────────────────────────────────────────────────────

function extractFromElement(
  el: StopElement,
  responses: Record<string, string | string[]>,
): GradeItem[] {
  const items: GradeItem[] = [];

  if (el.type === 'video') {
    for (const chunk of el.chunks) {
      for (const q of chunk.questions) {
        const val = str(responses[q.id]);
        if (q.scored_by === 'auto' && q.question_type !== 'short_answer') {
          const overrideKey = q.id + '_override';
          const override = responses[overrideKey];
          const grade = gradeAutoQ(q, val);
          const earned = (override !== undefined && override !== '') ? Number(override) : grade.earned;
          const disputeStatus = responses[q.id + '_dispute'] as any;
          const disputeNote = str(responses[q.id + '_dispute_note']);
          items.push({
            id: q.id, gradedBy: 'auto', prompt: q.text, response: val,
            hasResponse: !!val, elementType: 'video',
            earned, possible: grade.possible, correct: earned >= grade.possible,
            overrideKey, disputeStatus, disputeNote,
          });
        } else {
          const feedback = str(responses[q.id + '_feedback']);
          items.push({
            id: q.id, gradedBy: 'teacher', prompt: q.text, response: val,
            hasResponse: hasVal(responses[q.id]), earned: 0, possible: q.points, elementType: 'video',
            feedback,
          });
        }
      }
    }
  }

  if (el.type === 'tasks' && el.task_type === 'true_false_list') {
    for (const item of el.items) {
      const val = str(responses[item.id]);
      const overrideKey = item.id + '_override';
      const override = responses[overrideKey];
      const isCorrect = val ? (val === 'True') === item.correct_answer : false;
      const autoEarned = isCorrect ? item.points : 0;
      const earned = (override !== undefined && override !== '') ? Number(override) : autoEarned;
      const disputeStatus = responses[item.id + '_dispute'] as any;
      const disputeNote = str(responses[item.id + '_dispute_note']);
      items.push({
        id: item.id, gradedBy: 'auto', prompt: item.text, response: val,
        hasResponse: !!val, earned, possible: item.points,
        correct: earned >= item.points, elementType: 'true_false_list', overrideKey, disputeStatus, disputeNote,
      });
    }
  }

  if (el.type === 'tasks' && el.task_type === 'sort') {
    const key = `${el.id}_sort`;
    const raw = str(responses[key]);
    if (raw) {
      try {
        const placement = JSON.parse(raw) as Record<string, string>;
        let correctCount = 0;
        for (const item of el.items) {
          if (placement[item.id] === item.correct_column) correctCount++;
        }
        const possible = el.points ?? el.items.length;
        const ratio = el.items.length > 0 ? correctCount / el.items.length : 0;
        const autoEarned = Math.round(ratio * possible);
        const overrideKey = el.id + '_sort_override';
        const override = responses[overrideKey];
        const earned = (override !== undefined && override !== '') ? Number(override) : autoEarned;
        items.push({
          id: el.id, gradedBy: 'auto', prompt: el.title,
          response: `${correctCount}/${el.items.length} correct`,
          hasResponse: true, earned, possible,
          correct: earned >= possible, elementType: 'sort', overrideKey,
        });
      } catch { /* ignore parse errors */ }
    }
  }

  if (el.type === 'glossary') {
    for (const term of el.terms) {
      const val = str(responses[term.id]);
      const feedback = str(responses[term.id + '_feedback']);
      items.push({
        id: term.id, gradedBy: 'teacher', prompt: `Define: ${term.term}`,
        response: val, hasResponse: !!val.trim(), earned: 0, possible: 4, elementType: 'glossary',
        feedback,
      });
    }
  }

  if (el.type === 'reflection') {
    for (const p of el.prompts) {
      const val = str(responses[p.id]);
      const feedback = str(responses[p.id + '_feedback']);
      items.push({
        id: p.id, gradedBy: 'teacher', prompt: p.text, response: val,
        hasResponse: !!val.trim(), earned: 0, possible: p.points, elementType: 'reflection',
        feedback,
      });
    }
  }

  if (el.type === 'source_analysis') {
    let questionsToGrade = el.questions ?? [];
    if (el.choose_count) {
      questionsToGrade = questionsToGrade.filter(q => responses[`${el.id}_pick_${q.id}`] === '1');
    }
    for (const q of questionsToGrade) {
      const val = str(responses[q.id]);
      const feedback = str(responses[q.id + '_feedback']);
      items.push({
        id: q.id, gradedBy: 'teacher', prompt: q.text, response: val,
        hasResponse: !!val.trim(), earned: 0, possible: q.points, elementType: 'source_analysis',
        feedback,
      });
    }
  }

  if (el.type === 'activity') {
    for (const q of el.questions ?? []) {
      const val = str(responses[q.id]);
      items.push({
        id: q.id, gradedBy: 'teacher', prompt: q.text, response: val,
        hasResponse: !!val.trim(), earned: 0, possible: q.points, elementType: 'activity',
      });
    }
  }

  if (el.type === 'tasks' && el.task_type === 'free_response') {
    for (const f of el.fields) {
      if (f.notify_teacher) {
        const val = str(responses[f.id]);
        items.push({
          id: f.id, gradedBy: 'teacher', prompt: f.label, response: val,
          hasResponse: !!val.trim(), earned: 0, possible: f.points ?? 4, elementType: 'free_response',
        });
      }
    }
  }

  if (el.type === 'tasks' && el.task_type === 'tchart') {
    const hasAny = el.columns.some((col) => hasVal(responses[`${el.id}_${col.id}`]));
    if (hasAny) {
      items.push({
        id: el.id, gradedBy: 'teacher', prompt: el.title,
        response: 'T-Chart submitted', hasResponse: true, earned: 0,
        possible: el.points ?? 8, elementType: 'tchart',
      });
    }
  }

  return items;
}

// ─── Main grade function ──────────────────────────────────────────────────────

export function gradeStudent(
  responses: Record<string, string | string[]>,
): StudentGrade {
  let autoEarned = 0;
  let autoPossible = 0;
  let autoAttemptedPossible = 0;
  let teacherPending = 0;
  let teacherEarned = 0;
  let teacherScored = 0;
  let disputeCount = 0;
  let totalResponses = 0;

  const byStop: StopGrade[] = [];
  const byOutcome: Record<string, { earned: number; possible: number; pending: number }> = {};

  for (const stop of STOPS) {
    let stopAutoEarned = 0;
    let stopAutoPossible = 0;
    let stopTeacherPending = 0;
    const sessions: SessionGrade[] = [];

    for (const session of stop.sessions) {
      const allItems: GradeItem[] = [];
      for (const el of session.elements) {
        allItems.push(...extractFromElement(el, responses));
      }

      for (const item of allItems) {
        if (item.hasResponse) totalResponses++;
        if (item.gradedBy === 'auto') {
          stopAutoEarned += item.earned;
          stopAutoPossible += item.possible;
          if (item.hasResponse) autoAttemptedPossible += item.possible;
          if (item.disputeStatus === 'pending' && !item.correct) disputeCount++;
        } else if (item.hasResponse) {
          // Only count as pending if the teacher hasn't scored it yet
          const scoreKey = item.id + '_score';
          const existingScore = responses[scoreKey];
          if (existingScore === undefined || existingScore === '') {
            stopTeacherPending++;
          } else {
            // Accumulate teacher-scored totals for the student grade summary
            teacherEarned += Number(existingScore);
            teacherScored += item.possible;
          }
        }
      }

      if (allItems.length > 0) {
        sessions.push({ sessionId: session.id, sessionTitle: session.title, items: allItems });
      }
    }

    autoEarned += stopAutoEarned;
    autoPossible += stopAutoPossible;
    teacherPending += stopTeacherPending;

    byStop.push({
      stopId: stop.id,
      stopTitle: stop.title,
      outcomes: stop.outcomes,
      autoEarned: stopAutoEarned,
      autoPossible: stopAutoPossible,
      teacherPending: stopTeacherPending,
      sessions,
    });

    // Distribute points across outcomes equally
    for (const code of stop.outcomes) {
      if (!byOutcome[code]) byOutcome[code] = { earned: 0, possible: 0, pending: 0 };
      const perOutcome = stop.outcomes.length;
      byOutcome[code].earned += Math.round(stopAutoEarned / perOutcome);
      byOutcome[code].possible += Math.round(stopAutoPossible / perOutcome);
      byOutcome[code].pending += Math.round(stopTeacherPending / perOutcome);
    }
  }

  return {
    autoEarned,
    autoPossible,
    autoAttemptedPossible,
    autoPercent: autoAttemptedPossible > 0 ? Math.round((autoEarned / autoAttemptedPossible) * 100) : 0,
    teacherPending,
    teacherEarned,
    teacherScored,
    disputeCount,
    totalResponses,
    byStop,
    byOutcome,
  };
}
