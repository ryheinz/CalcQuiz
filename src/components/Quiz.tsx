import React, { useState, useEffect, useCallback } from 'react';
import { Bolt, CheckCircle2, Delete, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

interface Problem {
  num1: number;
  num2: number;
  answer: number;
}

export function Quiz() {
  const [problem, setProblem] = useState<Problem>({ num1: 0, num2: 0, answer: 0 });
  const [input, setInput] = useState('');
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateProblem = useCallback(() => {
    const n1 = Math.floor(Math.random() * 20) + 1;
    const n2 = Math.floor(Math.random() * 20) + 1;
    setProblem({ num1: n1, num2: n2, answer: n1 + n2 });
    setInput('');
    setProgress(prev => Math.min(prev + 5, 100));
  }, []);

  useEffect(() => {
    generateProblem();
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [generateProblem]);

  const handleDigit = (digit: string) => {
    if (input.length < 5) {
      setInput(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setInput(prev => prev.slice(0, -1));
  };

  const checkAnswer = () => {
    if (parseInt(input) === problem.answer) {
      setStreak(prev => prev + 1);
      setShowFeedback(true);
      setTimeout(() => {
        setShowFeedback(false);
        generateProblem();
      }, 1000);
    } else {
      setStreak(0);
      setInput('');
      // Shake animation effect could be added here
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-8 items-center justify-center">
      {/* Progress Bar */}
      <div className="w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
        <motion.div 
          className="bg-primary h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          style={{ boxShadow: '0 0 12px rgba(167, 139, 250, 0.4)' }}
        />
      </div>

      {/* Problem Display */}
      <div className="text-center space-y-2">
        <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase block">Current Challenge</span>
        <div className="relative">
          <h1 className="text-7xl font-black tracking-tighter text-on-surface">
            {problem.num1} + {problem.num2} = <span className="text-primary">?</span>
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
                Correct! +10 Points
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Answer Input Field */}
      <div className="w-full">
        <div className={cn(
          "w-full bg-surface-container border border-outline-variant rounded-2xl px-6 py-6 text-3xl font-mono text-center transition-all",
          input ? "text-on-surface" : "text-on-surface-variant/30"
        )}>
          {input || "Type your answer..."}
        </div>
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
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">Streak Multiplier</p>
            <p className="text-lg font-black text-on-surface">{streak}x Combo Active</p>
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
