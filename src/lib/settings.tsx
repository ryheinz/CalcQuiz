import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'de';

const THEME_KEY = 'calcroom-theme';
const LANGUAGE_KEY = 'calcroom-language';

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.calculatorTab': 'Calculator',
    'app.quizTab': 'Quiz',
    'app.themeToLight': 'Switch to light mode',
    'app.themeToDark': 'Switch to dark mode',

    'calculator.error': 'Error',

    'quiz.eyebrow': 'Mental Math',
    'quiz.setupTitle': 'Choose your challenge',
    'quiz.operationLabel': 'Operation',
    'quiz.op.add': 'Add',
    'quiz.op.subtract': 'Subtract',
    'quiz.op.multiply': 'Multiply',
    'quiz.op.divide': 'Divide',
    'quiz.sizeLabel': 'Number size',
    'quiz.level.1': '1-digit',
    'quiz.level.2': '2-digit',
    'quiz.level.3': '3-digit',
    'quiz.example': 'Example',
    'quiz.startQuiz': 'Start Quiz',

    'quiz.change': 'Change',
    'quiz.max': 'MAX',
    'quiz.currentChallenge': 'Current Challenge',
    'quiz.typeAnswer': 'Type your answer...',
    'quiz.correct': 'Correct! +10 Points',
    'quiz.leveledUp': 'Leveled up — {level} unlocked!',
    'quiz.wrong': "Not quite — try again",
    'quiz.scoreStreak': 'Score · Streak',
    'quiz.time': 'Time',
    'quiz.skip': 'Skip · New Problem',

    'quiz.timesUp': "Time's Up",
    'quiz.pointsScored': 'points scored',
    'quiz.bestStreak': 'Best streak: {n}x',
    'quiz.playAgain': 'Play Again',
    'quiz.changeScenario': 'Change Scenario',
  },
  de: {
    'app.calculatorTab': 'Rechner',
    'app.quizTab': 'Quiz',
    'app.themeToLight': 'Zum Hellmodus wechseln',
    'app.themeToDark': 'Zum Dunkelmodus wechseln',

    'calculator.error': 'Fehler',

    'quiz.eyebrow': 'Kopfrechnen',
    'quiz.setupTitle': 'Wähle deine Herausforderung',
    'quiz.operationLabel': 'Rechenart',
    'quiz.op.add': 'Addieren',
    'quiz.op.subtract': 'Subtrahieren',
    'quiz.op.multiply': 'Multiplizieren',
    'quiz.op.divide': 'Dividieren',
    'quiz.sizeLabel': 'Zahlengröße',
    'quiz.level.1': '1-stellig',
    'quiz.level.2': '2-stellig',
    'quiz.level.3': '3-stellig',
    'quiz.example': 'Beispiel',
    'quiz.startQuiz': 'Quiz starten',

    'quiz.change': 'Ändern',
    'quiz.max': 'MAX',
    'quiz.currentChallenge': 'Aktuelle Aufgabe',
    'quiz.typeAnswer': 'Antwort eingeben...',
    'quiz.correct': 'Richtig! +10 Punkte',
    'quiz.leveledUp': 'Aufgestiegen — {level} freigeschaltet!',
    'quiz.wrong': 'Nicht ganz — versuch\'s noch mal',
    'quiz.scoreStreak': 'Punkte · Serie',
    'quiz.time': 'Zeit',
    'quiz.skip': 'Überspringen · Neue Aufgabe',

    'quiz.timesUp': 'Zeit ist um',
    'quiz.pointsScored': 'Punkte erzielt',
    'quiz.bestStreak': 'Beste Serie: {n}x',
    'quiz.playAgain': 'Nochmal spielen',
    'quiz.changeScenario': 'Szenario ändern',
  },
};

function loadTheme(): Theme {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(THEME_KEY) : null;
  return saved === 'light' ? 'light' : 'dark';
}

function loadLanguage(): Language {
  const saved = typeof window !== 'undefined' ? window.localStorage.getItem(LANGUAGE_KEY) : null;
  return saved === 'de' ? 'de' : 'en';
}

interface SettingsContextValue {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [language, setLanguageState] = useState<Language>(loadLanguage);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('lang', language);
    window.localStorage.setItem(LANGUAGE_KEY, language);
  }, [language]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  const setLanguage = (lang: Language) => setLanguageState(lang);

  const t = (key: string, vars?: Record<string, string | number>): string => {
    let str = translations[language][key] ?? translations.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.split(`{${k}}`).join(String(v));
      }
    }
    return str;
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
}
