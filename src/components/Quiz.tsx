import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Bolt, CheckCircle2, Delete, CornerDownLeft, RotateCcw, Trophy,
  Plus, Minus, X, Divide, Sparkles, ChevronLeft, Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

const ROUND_SECONDS = 60;
const MAX_INPUT_LEN = 7;
const LEVEL_UP_STREAK = 8;

type Operation = 'add' | 'subtract' | 'multiply' | 'divide';
type Level = 1 | 2 | 3;
type Phase = 'setup' | 'active' | 'gameover';

interface Problem {
  left: number;
  right: number;
  operatorSymbol: string;
  answer: number;
}

const OPERATIONS: { id: Operation; label: string; icon: React.ReactNode }[] = [
  { id: 'add', label: 'Add', icon: <Plus className="w-4 h-4" /> },
  { id: 'subtract', label: 'Subtract', icon: <Minus className="w-4 h-4" /> },
  { id: 'multiply', label: 'Multiply', icon: <X className="w-4 h-4" /> },
  { id: 'divide', label: 'Divide', icon: <Divide className="w-4 h-4" /> },
];

const OPERATION_LABELS: Record<Operation, string> = {
  add: 'Add', subtract: 'Subtract', multiply: 'Multiply', divide: 'Divide',
};

const LEVELS: { value: Level; label: string }[] = [
  { value: 1, label: '1-digit' },
  { value: 2, label: '2-digit' },
  { value: 3, label: '3-digit' },
];

const DEFAULT_LEVELS: Record<Operation, Level> = { add: 1, subtract: 1, multiply: 2, divide: 2 };

const OPERATION_STORAGE_KEY = 'calcroom-quiz-operation';
const LEVEL_STORAGE_KEY = 'calcroom-quiz-levels';

function loadOperation(): Operation {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(OPERATION_STORAGE_KEY) : null;
  return saved === 'add' || saved === 'subtract' || saved === 'multiply' || saved === 'divide' ? saved : 'add';
}

function isValidLevel(value: unknown): value is Level {
  return value === 1 || value === 2 || value === 3;
}

function loadLevels(): Record<Operation, Level> {
  try {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LEVEL_STORAGE_KEY) : null;
    if (!saved) return { ...DEFAULT_LEVELS };
    const parsed = JSON.parse(saved);
    return {
      add: isValidLevel(parsed.add) ? parsed.add : DEFAULT_LEVELS.add,
      subtract: isValidLevel(parsed.subtract) ? parsed.subtract : DEFAULT_LEVELS.subtract,
      multiply: isValidLevel(parsed.multiply) ? parsed.multiply : DEFAULT_LEVELS.multiply,
      divide: isValidLevel(parsed.divide) ? parsed.divide : DEFAULT_LEVELS.divide,
    };
  } catch {
    return { ...DEFAULT_LEVELS };
  }
}

function randomDigitNumber(digits: number): number {
  const min = 10 ** (digits - 1);
  const max = 10 ** digits - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildProblem(operation: Operation, level: Level): Problem {
  if (operation === 'multiply') {
    const left = randomDigitNumber(level);
    const right = randomDigitNumber(level);
    return { left, right, operatorSymbol: '×', answer: left * right };
  }
  if (operation === 'divide') {
    const divisor = randomDigitNumber(level);
    const quotient = randomDigitNumber(level);
    return { left: divisor * quotient, right: divisor, operatorSymbol: '÷', answer: quotient };
  }
  if (operation === 'subtract') {
    const a = randomDigitNumber(level);
    const b = randomDigitNumber(level);
    const left = Math.max(a, b);
    const right = Math.min(a, b);
    return { left, right, operatorSymbol: '−', answer: left - right };
  }
  const left = randomDigitNumber(level);
  const right = randomDigitNumber(level);
  return { left, right, operatorSymbol: '+', answer: left + right };
}

export function Quiz() {
  const [operation, setOperation] = useState<Operation>(loadOperation);
  const [levels, setLevels] = useState<Record<Operation, Level>>(loadLevels);
  const [phase, setPhase] = useState<Phase>('setup');
  const [problem, setProblem] = useState<Problem>(() => buildProblem(loadOperation(), loadLevels()[loadOperation()]));
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('Correct! +10 Points');
  const [showWrong, setShowWrong] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(OPERATION_STORAGE_KEY, operation);
  }, [operation]);

  useEffect(() => {
    window.localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels));
  }, [levels]);

  const generateProblem = useCallback((op: Operation, level: Level) => {
    setProblem(buildProblem(op, level));
    setInput('');
  }, []);

  const startRound = useCallback(() => {
    setPhase('active');
    setStreak(0);
    setScore(0);
    setTimeLeft(ROUND_SECONDS);
    setShowWrong(false);
    setShowFeedback(false);
    generateProblem(operation, levels[operation]);
  }, [generateProblem, operation, levels]);

  const toggleLevel = () => {
    const newLevel = ((levels[operation] % 3) + 1) as Level;
    setLevels(prev => ({ ...prev, [operation]: newLevel }));
    generateProblem(operation, newLevel);
  };

  useEffect(() => {
    if (phase !== 'active') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('gameover');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase]);

  const handleDigit = (digit: string) => {
    if (phase !== 'active') return;
    if (input.length < MAX_INPUT_LEN) {
      setInput(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (phase !== 'active') return;
    setInput(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    if (phase !== 'active' || input === '') return;
    if (parseInt(input, 10) === problem.answer) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak(best => Math.max(best, nextStreak));
      setScore(prev => prev + 10);

      let nextLevel = levels[operation];
      let leveledUp = false;
      if (levels[operation] < 3 && nextStreak === LEVEL_UP_STREAK) {
        nextLevel = (levels[operation] + 1) as Level;
        leveledUp = true;
        setLevels(prev => ({ ...prev, [operation]: nextLevel }));
      }

      setFeedbackMessage(leveledUp ? `Leveled up — ${nextLevel}-digit unlocked!` : 'Correct! +10 Points');
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        generateProblem(operation, nextLevel);
      }, 800);
    } else {
      setStreak(0);
      setInput('');
      setShowWrong(true);
      setTimeout(() => setShowWrong(false), 400);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const previewProblem = useMemo(() => buildProblem(operation, levels[operation]), [operation, levels]);

  const progressPercent = (timeLeft / ROUND_SECONDS) * 100;
  const isLowTime = timeLeft <= 10;
  const currentLevel = levels[operation];
  const exprLength = `${problem.left}${problem.right}`.length;
  const problemSizeClass =
    exprLength >= 8 ? 'text-4xl' : exprLength >= 6 ? 'text-5xl' : exprLength >= 4 ? 'text-6xl' : 'text-7xl';

  if (phase === 'setup') {
    return (
      <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-6 items-center justify-center">
        <div className="text-center space-y-1">
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">Mental Math</span>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">Choose your challenge</h1>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Operation</p>
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
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full space-y-2">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">Number size</p>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map(lvl => (
              <button
                key={lvl.value}
                onClick={() => setLevels(prev => ({ ...prev, [operation]: lvl.value }))}
                className={cn(
                  "h-14 rounded-xl border font-bold text-sm transition-colors",
                  levels[operation] === lvl.value
                    ? "bg-primary text-on-primary border-transparent"
                    : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 text-center">
          <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">Example</p>
          <p className="text-2xl font-black text-on-surface tracking-tight">
            {previewProblem.left} {previewProblem.operatorSymbol} {previewProblem.right} = <span className="text-primary">?</span>
          </p>
        </div>

        <button
          onClick={startRound}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-colors"
        >
          <Play className="w-5 h-5 fill-current" />
          Start Quiz
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
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">Time's Up</span>
          <h1 className="text-6xl font-black tracking-tighter text-on-surface">{score}</h1>
          <p className="text-on-surface-variant text-sm font-medium">
            points scored · {OPERATION_LABELS[operation]} · {currentLevel}-digit
          </p>
        </div>
        <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 flex items-center justify-center gap-4">
          <Bolt className="w-5 h-5 text-tertiary fill-tertiary" />
          <p className="text-lg font-black text-on-surface">Best streak: {bestStreak}x</p>
        </div>
        <button
          onClick={startRound}
          className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-on-primary font-bold text-lg hover:opacity-90 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
        <button
          onClick={() => setPhase('setup')}
          className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors"
        >
          Change Scenario
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
          Change
        </button>
        <button
          onClick={toggleLevel}
          className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span>{OPERATION_LABELS[operation]} · {currentLevel}-digit</span>
          {currentLevel < 3 ? (
            <span className="text-primary">({streak}/{LEVEL_UP_STREAK})</span>
          ) : (
            <span className="text-tertiary">MAX</span>
          )}
        </button>
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
        <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">Current Challenge</span>
        <div className="relative">
          <h1 className={cn(problemSizeClass, "font-black tracking-tighter text-on-surface")}>
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
                {feedbackMessage.startsWith('Leveled') ? (
                  <Sparkles className="w-4 h-4 fill-tertiary text-on-tertiary" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 fill-tertiary text-on-tertiary" />
                )}
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
            "w-full bg-surface-container border rounded-2xl px-6 py-6 text-3xl font-mono text-center transition-colors",
            showWrong ? "border-red-400 text-red-400" : "border-outline-variant",
            !showWrong && (input ? "text-on-surface" : "text-on-surface-variant/30")
          )}
        >
          {showWrong ? "Not quite — try again" : (input || "Type your answer...")}
        </motion.div>
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
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Score · Streak</p>
            <p className="text-lg font-black text-on-surface">{score} pts · {streak}x</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Time</p>
            <p className="text-xl font-mono font-black text-primary">{formatTime(timeLeft)}</p>
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
