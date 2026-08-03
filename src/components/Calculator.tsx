import React, { useState, useEffect, useRef } from 'react';
import { Delete, Divide, X, Minus, Plus, Equal } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/lib/settings';

const MAX_DIGITS = 15;

function formatDisplay(value: string): string {
  const isNegative = value.startsWith('-');
  const unsigned = isNegative ? value.slice(1) : value;
  const [intPart, decimalPart] = unsigned.split('.');
  const groupedInt = Number(intPart || '0').toLocaleString('en-US');
  const grouped = decimalPart !== undefined ? `${groupedInt}.${decimalPart}` : groupedInt;
  return isNegative ? `-${grouped}` : grouped;
}

export function Calculator() {
  const { t } = useSettings();
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleDigit = (digit: string) => {
    if (hasError) {
      setDisplay(digit);
      setHasError(false);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      if (display.replace('-', '').replace('.', '').length >= MAX_DIGITS) return;
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleDecimal = () => {
    if (hasError) {
      setDisplay('0.');
      setHasError(false);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (nextOperator: string) => {
    if (hasError) return;
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
    setHistory(`${formatDisplay(display)} ${nextOperator}`);
  };

  const performCalculation = (op: string, a: number, b: number): number => {
    switch (op) {
      case '÷': return a / b;
      case '×': return a * b;
      case '−': return a - b;
      case '+': return a + b;
      default: return b;
    }
  };

  const handleEqual = () => {
    if (hasError || !operator || prevValue === null) return;
    const inputValue = parseFloat(display);
    const newValue = performCalculation(operator, prevValue, inputValue);

    if (!Number.isFinite(newValue)) {
      setDisplay('Error');
      setHasError(true);
      setPrevValue(null);
      setOperator(null);
      setWaitingForOperand(true);
      setHistory(`${formatDisplay(String(prevValue))} ${operator} ${formatDisplay(String(inputValue))} =`);
      return;
    }

    setDisplay(String(newValue));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setHistory(`${formatDisplay(String(prevValue))} ${operator} ${formatDisplay(String(inputValue))} =`);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHasError(false);
    setHistory('');
  };

  const handleBackspace = () => {
    if (hasError) {
      handleClear();
      return;
    }
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const handlePercent = () => {
    if (hasError) return;
    setDisplay(String(parseFloat(display) / 100));
  };

  const handleSignToggle = () => {
    if (hasError) return;
    setDisplay(prev => (prev.startsWith('-') ? prev.slice(1) : prev === '0' ? prev : `-${prev}`));
  };

  const handlersRef = useRef({
    handleDigit, handleDecimal, handleOperator, handleEqual, handleBackspace, handleClear, handlePercent,
  });
  useEffect(() => {
    handlersRef.current = {
      handleDigit, handleDecimal, handleOperator, handleEqual, handleBackspace, handleClear, handlePercent,
    };
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const h = handlersRef.current;
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        h.handleDigit(e.key);
        return;
      }
      switch (e.key) {
        case '.':
          e.preventDefault();
          h.handleDecimal();
          break;
        case '+':
          e.preventDefault();
          h.handleOperator('+');
          break;
        case '-':
          e.preventDefault();
          h.handleOperator('−');
          break;
        case '*':
          e.preventDefault();
          h.handleOperator('×');
          break;
        case '/':
          e.preventDefault();
          h.handleOperator('÷');
          break;
        case 'Enter':
        case '=':
          e.preventDefault();
          h.handleEqual();
          break;
        case 'Backspace':
          e.preventDefault();
          h.handleBackspace();
          break;
        case 'Escape':
          e.preventDefault();
          h.handleClear();
          break;
        case '%':
          e.preventDefault();
          h.handlePercent();
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
            {operator && prevValue !== null ? `${formatDisplay(String(prevValue))} ${operator}` : ''}
          </div>
          <motion.div
            key={display}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "text-6xl font-bold tracking-tighter leading-none truncate w-full text-right",
              hasError ? "text-red-400" : "text-on-surface"
            )}
          >
            {hasError ? t('calculator.error') : formatDisplay(display)}
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
        <CalcButton onClick={handleSignToggle} variant="surface-highest" className="text-tertiary text-lg">
          +/−
        </CalcButton>
        <CalcButton onClick={() => handleDigit('0')}>0</CalcButton>
        <CalcButton onClick={handleDecimal}>.</CalcButton>
        <CalcButton onClick={handleEqual} variant="tertiary">
          <Equal className="w-7 h-7" />
        </CalcButton>
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
