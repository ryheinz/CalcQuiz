export type Operation = 'add' | 'subtract' | 'multiply' | 'divide';
export type DigitMode = '1' | '2' | '3' | '23';

export interface QuizResult {
  id: string;
  operation: Operation;
  digitMode: DigitMode;
  duration: number;
  score: number;
  bestStreak: number;
  correct: number;
  tried: number;
  skipped: number;
  date: number;
}

const STORAGE_KEY = 'calcroom-quiz-history';
const MAX_RESULTS = 100;

export function loadHistory(): QuizResult[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function recordResult(result: Omit<QuizResult, 'id' | 'date'>): QuizResult[] {
  const history = loadHistory();
  const entry: QuizResult = {
    ...result,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: Date.now(),
  };
  const next = [entry, ...history].slice(0, MAX_RESULTS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function accuracyOf(result: QuizResult): number | null {
  if (result.tried <= 0) return null;
  return Math.round((result.correct / result.tried) * 100);
}
