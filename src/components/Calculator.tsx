import React, { useState } from 'react';
import { Delete, Percent, Divide, X, Minus, Plus, Equal, ArrowLeftRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = performCalculation(operator, currentValue, inputValue);
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
    setHistory(`${display} ${nextOperator}`);
  };

  const performCalculation = (op: string, a: number, b: number) => {
    switch (op) {
      case '÷': return a / b;
      case '×': return a * b;
      case '−': return a - b;
      case '+': return a + b;
      default: return b;
    }
  };

  const handleEqual = () => {
    const inputValue = parseFloat(display);
    if (operator && prevValue !== null) {
      const newValue = performCalculation(operator, prevValue, inputValue);
      setDisplay(String(newValue));
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setHistory(`${prevValue} ${operator} ${inputValue} =`);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistory('');
  };

  const handleBackspace = () => {
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handlePercent = () => {
    setDisplay(String(parseFloat(display) / 100));
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-4 py-6">
      {/* Display Area */}
      <div className="flex-1 flex flex-col justify-end gap-4 mb-8">
        <div className="text-right px-2">
          <span className="text-on-surface-variant text-sm font-medium transition-all">
            {history}
          </span>
        </div>
        <div className="bg-surface-container rounded-2xl border border-outline-variant p-8 flex flex-col items-end justify-center min-h-[160px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-4 right-6 text-on-surface-variant/40 text-lg font-medium group-hover:text-on-surface-variant/60 transition-colors">
            {operator && prevValue !== null ? `${prevValue} ${operator}` : ''}
          </div>
          <motion.div 
            key={display}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-on-surface text-6xl font-bold tracking-tighter leading-none truncate w-full text-right"
          >
            {display.toLocaleString()}
          </motion.div>
        </div>
      </div>

      {/* Keypad Area */}
      <div className="grid grid-cols-4 gap-3">
        {/* Row 1 */}
        <CalcButton onClick={handleClear} variant="surface" className="text-primary font-bold">AC</CalcButton>
        <CalcButton onClick={handleBackspace} variant="surface">
          <Delete className="w-5 h-5" />
        </CalcButton>
        <CalcButton onClick={handlePercent} variant="surface">%</CalcButton>
        <CalcButton onClick={() => handleOperator('÷')} variant="primary">
          <Divide className="w-6 h-6" />
        </CalcButton>

        {/* Row 2 */}
        <CalcButton onClick={() => handleDigit('7')}>7</CalcButton>
        <CalcButton onClick={() => handleDigit('8')}>8</CalcButton>
        <CalcButton onClick={() => handleDigit('9')}>9</CalcButton>
        <CalcButton onClick={() => handleOperator('×')} variant="primary">
          <X className="w-6 h-6" />
        </CalcButton>

        {/* Row 3 */}
        <CalcButton onClick={() => handleDigit('4')}>4</CalcButton>
        <CalcButton onClick={() => handleDigit('5')}>5</CalcButton>
        <CalcButton onClick={() => handleDigit('6')}>6</CalcButton>
        <CalcButton onClick={() => handleOperator('−')} variant="primary">
          <Minus className="w-6 h-6" />
        </CalcButton>

        {/* Row 4 */}
        <CalcButton onClick={() => handleDigit('1')}>1</CalcButton>
        <CalcButton onClick={() => handleDigit('2')}>2</CalcButton>
        <CalcButton onClick={() => handleDigit('3')}>3</CalcButton>
        <CalcButton onClick={() => handleOperator('+')} variant="primary">
          <Plus className="w-6 h-6" />
        </CalcButton>

        {/* Row 5 */}
        <CalcButton variant="surface-highest" className="text-tertiary">
          <ArrowLeftRight className="w-5 h-5" />
        </CalcButton>
        <CalcButton onClick={() => handleDigit('0')}>0</CalcButton>
        <CalcButton onClick={() => handleDigit('.')}>.</CalcButton>
        <CalcButton onClick={handleEqual} variant="tertiary">
          <Equal className="w-7 h-7" />
        </CalcButton>
      </div>

      {/* Mode Switch Footer */}
      <div className="mt-8">
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant">
          <div className="flex flex-col">
            <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Active Mode</span>
            <span className="text-sm text-on-surface font-semibold">Standard Arithmetic</span>
          </div>
          <button className="px-4 py-2 bg-surface-container-highest text-primary text-xs font-bold rounded-lg border border-primary/20 hover:bg-primary/10 transition-colors">
            Mode Switch
          </button>
        </div>
      </div>
    </div>
  );
}

interface CalcButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'surface' | 'tertiary' | 'surface-highest';
  className?: string;
  colSpan?: number;
}

function CalcButton({ children, onClick, variant = 'default', className, colSpan = 1 }: CalcButtonProps) {
  const variants = {
    default: "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high",
    primary: "bg-primary text-on-primary border-transparent hover:opacity-90",
    surface: "bg-surface-container-high border-outline-variant text-on-surface hover:bg-surface-container-highest",
    tertiary: "bg-tertiary text-on-tertiary border-transparent hover:opacity-90",
    'surface-highest': "bg-surface-container-highest border-outline-variant text-on-surface hover:bg-surface"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "h-16 flex items-center justify-center rounded-xl border transition-colors text-xl font-medium",
        variants[variant],
        colSpan > 1 && `col-span-${colSpan}`,
        className
      )}
    >
      {children}
    </motion.button>
  );
}
