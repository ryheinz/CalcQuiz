import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Bolt, CheckCircle2, Delete, CornerDownLeft, RotateCcw, Trophy,
  Plus, Minus, X, Divide, ChevronLeft, Play, Pause, SkipForward,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/lib/settings';
import { recordResult, type Operation, type DigitMode } from '@/src/lib/progress';

const DEFAULT_DURATION = 120;
const DURATIONS = [30, 60, 90, 120];
const MAX_INPUT_LEN = 7;
const RAMP_PROBLEMS = 12;

type Phase = 'setup' | 'active' | 'gameover';

interface Problem {
  left: number;
  right: number;
  operatorSymbol: string;
  answer: number;
}

const OPERATIONS: { id: Operation; icon: React.ReactNode }[] = [
  { id: 'add', icon: <Plus className="w-4 h-4" /> },
  { id: 'subtract', icon: <Minus className="w-4 h-4" /> },
  { id: 'multiply', icon: <X className="w-4 h-4" /> },
  { id: 'divide', icon: <Divide className="w-4 h-4" /> },
];

const DIGIT_VALUES: DigitMode[] = ['1', '2', '3', '23'];

const OPERATION_STORAGE_KEY = 'calcroom-quiz-operation';
const DIGIT_STORAGE_KEY = 'calcroom-quiz-digits';
const LEGACY_DIFFICULTY_STORAGE_KEY = 'calcroom-quiz-difficulty';
const DURATION_STORAGE_KEY = 'calcroom-quiz-duration';

function loadDuration(): number {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(DURATION_STORAGE_KEY) : null;
  if (saved === null) return DEFAULT_DURATION;
  const parsed = parseInt(saved, 10);
  return DURATIONS.includes(parsed) ? parsed : DEFAULT_DURATION;
}

function loadOperation(): Operation {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(OPERATION_STORAGE_KEY) : null;
  return saved === 'add' || saved === 'subtract' || saved === 'multiply' || saved === 'divide' ? saved : 'add';
}

function loadDigitMode(): DigitMode {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(DIGIT_STORAGE_KEY) : null;
  if (saved === '1' || saved === '2' || saved === '3' || saved === '23') return saved;
  const legacy = typeof window !== 'undefined' ? window.localStorage.getItem(LEGACY_DIFFICULTY_STORAGE_KEY) : null;
  if (legacy === 'easy') return '1';
  if (legacy === 'master') return '3';
  if (legacy === 'hard') return '23';
  return '23';
}

function randomNumberInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Numbers progress through three stages as the round goes on (easy → hard).
// Each size mode defines what those stages feel like:
//   '1':  1-digit, getting up to 9s.
//   '2':  2-digit, ramping from ~10s up to the 90s.
//   '3':  3-digit, ramping from ~100s up to the 900s.
//   '23': starts with 2-digit questions, then moves into 3-digit as it hardens.
function sampleOperand(mode: DigitMode, progress: number): number {
  const stage = progress < 1 / 3 ? 0 : progress < 2 / 3 ? 1 : 2;
  if (mode === '1') {
    const ranges: [number, number][] = [[2, 4], [5, 7], [7, 9]];
    return randomNumberInRange(...ranges[stage]);
  }
  if (mode === '2') {
    const ranges: [number, number][] = [[10, 39], [30, 69], [60, 99]];
    return randomNumberInRange(...ranges[stage]);
  }
  if (mode === '3') {
    const ranges: [number, number][] = [[100, 399], [300, 699], [600, 999]];
    return randomNumberInRange(...ranges[stage]);
  }
  const ranges: [number, number][] = [[10, 49], [100, 499], [400, 999]];
  return randomNumberInRange(...ranges[stage]);
}

function buildProblem(operation: Operation, mode: DigitMode, progress: number): Problem {
  if (operation === 'multiply') {
    const left = sampleOperand(mode, progress);
    const right = sampleOperand(mode, progress);
    return { left, right, operatorSymbol: '×', answer: left * right };
  }
  if (operation === 'divide') {
    const divisor = sampleOperand(mode, progress);
    const quotient = sampleOperand(mode, progress);
    return { left: divisor * quotient, right: divisor, operatorSymbol: '÷', answer: quotient };
  }
  if (operation === 'subtract') {
    const a = sampleOperand(mode, progress);
    const b = sampleOperand(mode, progress);
    const left = Math.max(a, b);
    const right = Math.min(a, b);
    return { left, right, operatorSymbol: '−', answer: left - right };
  }
  const left = sampleOperand(mode, progress);
  const right = sampleOperand(mode, progress);
  return { left, right, operatorSymbol: '+', answer: left + right };
}

// Preview for the setup screen. For the mixed '23' mode we draw one
// 2-digit and one 3-digit operand so the example shows what the mode
// actually looks like (numbers grow into 3 digits as it hardens).
function buildPreviewProblem(operation: Operation, mode: DigitMode): Problem {
  if (mode !== '23') return buildProblem(operation, mode, 0);
  const twoDigit = randomNumberInRange(10, 39);
  const threeDigit = randomNumberInRange(100, 399);
  if (operation === 'multiply') {
    return { left: twoDigit, right: threeDigit, operatorSymbol: '×', answer: twoDigit * threeDigit };
  }
  if (operation === 'divide') {
    // Keep the answer a whole number: (3-digit) ÷ (2-digit divisor).
    const quotient = threeDigit / twoDigit;
    const whole = Math.round(quotient);
    return { left: twoDigit * whole, right: twoDigit, operatorSymbol: '÷', answer: whole };
  }
  if (operation === 'subtract') {
    const left = Math.max(threeDigit, twoDigit);
    const right = Math.min(threeDigit, twoDigit);
    return { left, right, operatorSymbol: '−', answer: left - right };
  }
  return { left: twoDigit, right: threeDigit, operatorSymbol: '+', answer: twoDigit + threeDigit };
}

export function Quiz() {
  const { t } = useSettings();
  const [operation, setOperation] = useState<Operation>(loadOperation);
  const [digitMode, setDigitMode] = useState<DigitMode>(loadDigitMode);
  const [phase, setPhase] = useState<Phase>('setup');
  const [problem, setProblem] = useState<Problem>(() => buildProblem(loadOperation(), loadDigitMode(), 0));
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [triedCount, setTriedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const [roundIndex, setRoundIndex] = useState(0);
  const [duration, setDuration] = useState<number>(loadDuration);
  const [paused, setPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackKind, setFeedbackKind] = useState<'correct'>('correct');
  const [showWrong, setShowWrong] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(OPERATION_STORAGE_KEY, operation);
  }, [operation]);

  useEffect(() => {
    window.localStorage.setItem(DIGIT_STORAGE_KEY, digitMode);
  }, [digitMode]);

  useEffect(() => {
    window.localStorage.setItem(DURATION_STORAGE_KEY, String(duration));
  }, [duration]);

  const generateProblem = useCallback((op: Operation, problemNumber: number) => {
    const progress = Math.min(1, problemNumber / RAMP_PROBLEMS);
    setProblem(buildProblem(op, digitMode, progress));
    setRoundIndex(problemNumber + 1);
    setInput('');
    setWrongAttempts(0);
  }, [digitMode]);

  const startRound = useCallback(() => {
    setPhase('active');
    setStreak(0);
    setScore(0);
    setCorrectCount(0);
    setTriedCount(0);
    setSkippedCount(0);
    setTimeLeft(duration);
    setPaused(false);
    setShowWrong(false);
    setShowFeedback(false);
    generateProblem(operation, 0);
  }, [generateProblem, operation, duration]);

  const togglePause = () => setPaused(prev => !prev);

  const snapshotRef = useRef({
    score: 0, bestStreak: 0, correctCount: 0, triedCount: 0, skippedCount: 0,
  });
  useEffect(() => {
    snapshotRef.current = {
      score, bestStreak, correctCount, triedCount, skippedCount,
    };
  });

  useEffect(() => {
    // Pause the countdown while the timer is paused or a feedback/reveal
    // animation is on screen so those locked windows don't eat into thinking time.
    if (phase !== 'active' || paused || showFeedback || showWrong) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Snapshot reflects the final counters for the just-finished round.
          const s = snapshotRef.current;
          const finalScore = s.score;
          recordResult({
            operation,
            digitMode,
            duration,
            score: finalScore,
            bestStreak: s.bestStreak,
            correct: s.correctCount,
            tried: s.triedCount,
            skipped: s.skippedCount,
          });
          setPhase('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, paused, showFeedback, showWrong, operation, digitMode, duration]);

  const handleDigit = (digit: string) => {
    if (phase !== 'active' || showFeedback || showWrong) return;
    if (input.length < MAX_INPUT_LEN) {
      setInput(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (phase !== 'active' || showFeedback || showWrong) return;
    setInput(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    if (phase !== 'active' || showFeedback || showWrong || input === '') return;
    if (parseInt(input, 10) === problem.answer) {
      // Clear immediately so a repeated Enter/submit press during the
      // feedback animation can't re-score the same answer against the
      // same (about to change) problem.
      setInput('');

      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(best => Math.max(best, nextStreak));
      setScore(prev => prev + 10);
      setTriedCount(prev => prev + 1);
      setCorrectCount(prev => prev + 1);

      setFeedbackMessage(t('quiz.correct'));
      setFeedbackKind('correct');
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        generateProblem(operation, roundIndex);
      }, 800);
    } else {
      setStreak(0);
      setTriedCount(prev => prev + 1);
      const attemptsSoFar = wrongAttempts + 1;
      setWrongAttempts(attemptsSoFar);
      setShowWrong(true);

      if (attemptsSoFar >= 3) {
        // Third miss on this problem: reveal the answer and move on.
        setTimeout(() => {
          setShowWrong(false);
          generateProblem(operation, roundIndex);
        }, 1600);
      } else {
        // First or second miss: quick shake, give another chance at the same problem.
        setTimeout(() => {
          setShowWrong(false);
          setInput('');
        }, 600);
      }
    }
  };

  const skipProblem = () => {
    if (phase !== 'active' || showFeedback || showWrong) return;
    setStreak(0);
    setSkippedCount(prev => prev + 1);
    generateProblem(operation, roundIndex);
  };

  const handlersRef = useRef({ handleDigit, handleBackspace, checkAnswer, startRound, phase });
  useEffect(() => {
    handlersRef.current = { handleDigit, handleBackspace, checkAnswer, startRound, phase };
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      const h = handlersRef.current;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        h.handleDigit(e.key);
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        h.handleBackspace();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (h.phase === 'active') {
          h.checkAnswer();
        } else {
          h.startRound();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show the "start easy" range for the selected size. Progress 0 always
  // lands on the 2-digit stage for the mixed '23' mode, so the example
  // makes the "2 & 3 Digits" label obvious instead of always being 3-digit.
  const previewProblem = useMemo(() => buildPreviewProblem(operation, digitMode), [operation, digitMode]);

  const progressPercent = (timeLeft / duration) * 100;
  const isLowTime = timeLeft <= 10;
  const exprLength = `${problem.left}${problem.right}`.length;
  const problemSizeClass =
    exprLength >= 8 ? 'text-4xl' : exprLength >= 6 ? 'text-5xl' : exprLength >= 4 ? 'text-6xl' : 'text-7xl';
  const operationLabel = t(`quiz.op.${operation}`);
  const digitsLabel = t(`quiz.digits.${digitMode}`);

  if (phase === 'setup') {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-6 items-center justify-center">
        <div className="text-center space-y-1">
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">{t('quiz.eyebrow')}</span>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">{t('quiz.setupTitle')}</h1>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">{t('quiz.operationLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            {OPERATIONS.map(op => (
              <button
                key={op.id}
                onClick={() => setOperation(op.id)}
                className={cn(
                  "flex items-center justify-center gap-2 h-14 rounded-xl border font-bold text-sm transition-colors",
                  operation === op.id
                    ? "bg-primary text-on-primary border-transparent"
                    : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                )}
              >
                {op.icon}
                {t(`quiz.op.${op.id}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">{t('quiz.sizeLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            {DIGIT_VALUES.map(mode => (
              <button
                key={mode}
                onClick={() => setDigitMode(mode)}
                className={cn(
                  "h-14 rounded-xl border font-bold text-sm transition-colors",
                  digitMode === mode
                    ? "bg-primary text-on-primary border-transparent"
                    : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                )}
              >
                {t(`quiz.digits.${mode}`)}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-on-surface-variant px-1">{t('quiz.sizeHint')}</p>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">{t('quiz.durationLabel')}</p>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map(secs => (
              <button
                key={secs}
                onClick={() => setDuration(secs)}
                className={cn(
                  "h-14 rounded-xl border font-bold text-sm transition-colors",
                  duration === secs
                    ? "bg-primary text-on-primary border-transparent"
                    : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                )}
              >
                {formatTime(secs)}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">{t('quiz.example')}</p>
          <p className="text-2xl font-black text-on-surface tracking-tight">
            {previewProblem.left} {previewProblem.operatorSymbol} {previewProblem.right} = <span className="text-primary">?</span>
          </p>
        </div>

        <button
          onClick={startRound}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
          {t('quiz.startQuiz')}
        </button>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-6 items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-tertiary/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-tertiary" />
        </div>
        <div className="space-y-2">
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">{t('quiz.timesUp')}</span>
          <h1 className="text-6xl font-black tracking-tighter text-on-surface">{score}</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            {t('quiz.pointsScored')} · {operationLabel} · {digitsLabel}
          </p>
        </div>
        <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 flex items-center justify-center gap-4">
          <Bolt className="w-5 h-5 text-tertiary fill-tertiary" />
          <p className="text-lg font-black text-on-surface">{t('quiz.bestStreak', { n: bestStreak })}</p>
        </div>
        <button
          onClick={startRound}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          {t('quiz.playAgain')}
        </button>
        <button
          onClick={() => setPhase('setup')}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors"
        >
          {t('quiz.changeScenario')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-5 items-center justify-center">
      {/* Scenario bar */}
      <div className="w-full flex items-center justify-between gap-2">
        <button
          onClick={() => setPhase('setup')}
          className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('quiz.change')}
        </button>
        <span className="text-xs font-semibold text-on-surface-variant">{operationLabel} · {digitsLabel}</span>
      </div>

      {/* Progress Bar (time remaining) */}
      <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full", isLowTime ? "bg-red-400" : "bg-primary")}
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{ boxShadow: isLowTime ? '0 0 12px rgba(248, 113, 113, 0.5)' : '0 0 12px rgba(167, 139, 250, 0.4)' }}
        />
      </div>

      {/* Problem Display */}
      <div className="text-center space-y-2">
        <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">{t('quiz.currentChallenge')}</span>
        <div className="relative">
          <h1 className={cn(problemSizeClass, "font-black tracking-tighter text-on-surface notranslate")} translate="no">
            {problem.left} {problem.operatorSymbol} {problem.right} = <span className="text-primary">?</span>
          </h1>
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: -60, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-tertiary/20 text-tertiary border border-tertiary/30 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 fill-tertiary text-on-tertiary" />
                {feedbackMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Answer Input Field */}
      <div className="w-full">
        <motion.div
          animate={showWrong ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
          transition={{ duration: 0.4 }}
          className={cn(
            "w-full bg-surface-container border rounded-2xl px-6 py-6 font-mono text-center transition-colors notranslate",
            showWrong && wrongAttempts >= 3 && "border-red-400 text-red-400 text-lg font-semibold",
            showWrong && wrongAttempts < 3 && "border-red-400 text-red-400 text-3xl",
            !showWrong && "border-outline-variant text-3xl",
            !showWrong && (input ? "text-on-surface" : "text-on-surface-variant/30")
          )}
          translate="no"
        >
          {showWrong
            ? (wrongAttempts >= 3
                ? t('quiz.wrongDetail', { given: input, answer: problem.answer })
                : (wrongAttempts === 2 ? t('quiz.lastTry') : t('quiz.tryAgain')))
            : (input || t('quiz.typeAnswer'))}
        </motion.div>
        <button
          onClick={skipProblem}
          className="w-full flex items-center justify-center gap-1.5 mt-2 py-1 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <SkipForward className="w-3.5 h-3.5" />
          {t('quiz.skip')}
        </button>
      </div>

      {/* Custom Keypad */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <KeyButton key={num} onClick={() => handleDigit(num.toString())}>{num}</KeyButton>
        ))}
        <KeyButton onClick={handleBackspace} variant="surface">
          <Delete className="w-6 h-6" />
        </KeyButton>
        <KeyButton onClick={() => handleDigit('0')}>0</KeyButton>
        <KeyButton onClick={checkAnswer} variant="primary">
          <CornerDownLeft className="w-6 h-6" />
        </KeyButton>
      </div>

      {/* Info Card */}
      <div className="w-full">
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-tertiary/20 flex items-center justify-center">
            <Bolt className="w-6 h-6 text-tertiary fill-tertiary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t('quiz.scoreStreak')}</p>
            <p className="text-lg font-black text-on-surface">{score} pts · {streak}x</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t('quiz.time')}</p>
            <div className="flex items-center justify-end gap-1.5">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={togglePause}
                aria-label={paused ? t('quiz.resume') : t('quiz.pause')}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center border transition-colors",
                  paused
                    ? "bg-tertiary/20 text-tertiary border-tertiary/40"
                    : "bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-container-high hover:text-on-surface"
                )}
              >
                {paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              </motion.button>
              <p className={cn("text-xl font-mono font-black", paused ? "text-tertiary" : "text-primary")}>{formatTime(timeLeft)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface KeyButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'surface';
  key?: React.Key;
}

function KeyButton({ children, onClick, variant = 'default' }: KeyButtonProps) {
  const styles = {
    default: "bg-surface-container-high border-outline-variant text-on-surface hover:bg-surface-container-highest",
    primary: "bg-primary text-on-primary border-transparent hover:opacity-90",
    surface: "bg-surface-container-low border-outline-variant text-on-surface hover:bg-surface-container"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={cn(
        "h-16 flex items-center justify-center rounded-2xl border transition-all text-2xl font-bold",
        styles[variant]
      )}
    >
      {children}
    </motion.button>
  );
}
