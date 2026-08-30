import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'de';

const THEME_KEY = 'calcroom-theme';
const LANGUAGE_KEY = 'calcroom-language';

const translations: Record<Language, Record<string, string>> = {
  en: {
    'app.calculatorTab': 'Calculator',
    'app.quizTab': 'Quiz',
    'app.progressTab': 'Progress',
    'app.themeToLight': 'Switch to light mode',
    'app.themeToDark': 'Switch to dark mode',

    'app.wishNav': 'Wish',
    'app.wishTitle': 'Make a wish',
    'app.wishSubtitle': 'Have an idea for CalcRoom? Share it — it may be built next.',
    'app.wishPlaceholder': 'Describe your feature idea...',
    'app.wishEmailPlaceholder': 'Your email (optional)',
    'app.wishSubmit': 'Send idea',
    'app.wishCancel': 'Cancel',
    'app.wishClose': 'Close',
    'app.wishSent': "Thanks! Your idea is on its way.",
    'app.wishError': "Couldn't send. Please try again.",

    'calculator.error': 'Error',

    'quiz.eyebrow': 'Mental Math',
    'quiz.setupTitle': 'Choose your challenge',
    'quiz.operationLabel': 'Operation',
    'quiz.op.add': 'Add',
    'quiz.op.subtract': 'Subtract',
    'quiz.op.multiply': 'Multiply',
    'quiz.op.divide': 'Divide',
'quiz.sizeLabel': 'Number size',
    'quiz.sizeHint': 'Questions start easy and get harder as the round goes on.',
    'quiz.digits.1': '1 Digit',
    'quiz.digits.2': '2 Digits',
    'quiz.digits.3': '3 Digits',
    'quiz.digits.23': '2 & 3 Digits',
    'quiz.example': 'Example',
    'quiz.startQuiz': 'Start Quiz',
    'quiz.evenOddLabel': 'Even & Odd mix',
    'quiz.evenOddHint': 'First number even, second number odd (e.g. 34 + 21).',

    'quiz.change': 'Change',
    'quiz.currentChallenge': 'Current Challenge',
    'quiz.typeAnswer': 'Type your answer...',
    'quiz.correct': 'Correct! +10 Points',
    'quiz.tryAgain': 'Not quite — try again',
    'quiz.lastTry': 'Not quite — last chance!',
    'quiz.wrongDetail': 'You wrote {given} — the answer was {answer}',
    'quiz.scoreStreak': 'Score · Streak',
    'quiz.time': 'Time',
    'quiz.pause': 'Pause',
    'quiz.resume': 'Resume',
    'quiz.skip': 'Skip · New Problem',

    'quiz.timesUp': "Time's Up",
    'quiz.pointsScored': 'points scored',
    'quiz.bestStreak': 'Best streak: {n}x',
    'quiz.playAgain': 'Play Again',
    'quiz.changeScenario': 'Change Scenario',

    'progress.title': 'Progress',
    'progress.subtitle': 'Track your improvement',
    'progress.empty': 'No results yet',
    'progress.emptyHint': 'Play a quiz round and your results will show up here.',
    'progress.rateTitle': 'Your rating',
    'progress.accuracy': 'Accuracy: {n}%',
    'progress.bestStreak': 'Best streak: {n}x',
    'progress.games': 'Games',
    'progress.totalPoints': 'Total points',
    'progress.bestScore': 'Best score',
    'progress.bestPerScenario': 'Personal bests',
    'progress.pointsShort': '{n} pts',
    'progress.recent': 'Recent games',
    'progress.clearAll': 'Clear history',
  },
  de: {
    'app.calculatorTab': 'Rechner',
    'app.quizTab': 'Quiz',
    'app.progressTab': 'Fortschritt',
    'app.themeToLight': 'Zum Hellmodus wechseln',
    'app.themeToDark': 'Zum Dunkelmodus wechseln',

    'app.wishNav': 'Wunsch',
    'app.wishTitle': 'Dein Wunsch',
    'app.wishSubtitle': 'Hast du eine Idee für CalcRoom? Teile sie — sie wird vielleicht als Nächstes gebaut.',
    'app.wishPlaceholder': 'Beschreibe deine Feature-Idee...',
    'app.wishEmailPlaceholder': 'Deine E-Mail (optional)',
    'app.wishSubmit': 'Idee senden',
    'app.wishCancel': 'Abbrechen',
    'app.wishClose': 'Schließen',
    'app.wishSent': 'Danke! Deine Idee ist unterwegs.',
    'app.wishError': 'Senden fehlgeschlagen. Bitte versuch es erneut.',

    'calculator.error': 'Fehler',

    'quiz.eyebrow': 'Kopfrechnen',
    'quiz.setupTitle': 'Wähle deine Herausforderung',
    'quiz.operationLabel': 'Rechenart',
    'quiz.op.add': 'Addieren',
    'quiz.op.subtract': 'Subtrahieren',
    'quiz.op.multiply': 'Multiplizieren',
    'quiz.op.divide': 'Dividieren',
    'quiz.sizeLabel': 'Zahlengröße',
    'quiz.sizeHint': 'Die Aufgaben starten leicht und werden im Verlauf schwerer.',
    'quiz.digits.1': '1-stellig',
    'quiz.digits.2': '2-stellig',
    'quiz.digits.3': '3-stellig',
    'quiz.digits.23': '2 & 3 Stellen',
    'quiz.durationLabel': 'Zeitlimit',
    'quiz.example': 'Beispiel',
    'quiz.startQuiz': 'Quiz starten',
    'quiz.evenOddLabel': 'Gerade & Ungerade Mix',
    'quiz.evenOddHint': 'Erste Zahl gerade, zweite Zahl ungerade (z. B. 34 + 21).',

    'quiz.change': 'Ändern',
    'quiz.currentChallenge': 'Aktuelle Aufgabe',
    'quiz.typeAnswer': 'Antwort eingeben...',
    'quiz.correct': 'Richtig! +10 Punkte',
    'quiz.tryAgain': 'Nicht ganz — versuch\'s noch mal',
    'quiz.lastTry': 'Nicht ganz — letzte Chance!',
    'quiz.wrongDetail': 'Du hast {given} geschrieben — die Antwort war {answer}',
    'quiz.scoreStreak': 'Punkte · Serie',
    'quiz.time': 'Zeit',
    'quiz.pause': 'Pause',
    'quiz.resume': 'Weiter',
    'quiz.skip': 'Überspringen · Neue Aufgabe',

    'quiz.timesUp': 'Zeit ist um',
    'quiz.pointsScored': 'Punkte erzielt',
    'quiz.bestStreak': 'Beste Serie: {n}x',
    'quiz.playAgain': 'Nochmal spielen',
    'quiz.changeScenario': 'Szenario ändern',

    'progress.title': 'Fortschritt',
    'progress.subtitle': 'Verfolge deine Verbesserung',
    'progress.empty': 'Noch keine Ergebnisse',
    'progress.emptyHint': 'Spiele eine Quizrunde und deine Ergebnisse erscheinen hier.',
    'progress.rateTitle': 'Deine Bewertung',
    'progress.accuracy': 'Genauigkeit: {n}%',
    'progress.bestStreak': 'Beste Serie: {n}x',
    'progress.games': 'Spiele',
    'progress.totalPoints': 'Gesamtpunkte',
    'progress.bestScore': 'Bestes Ergebnis',
    'progress.bestPerScenario': 'Persönliche Bestleistungen',
    'progress.pointsShort': '{n} Pkt.',
    'progress.recent': 'Letzte Spiele',
    'progress.clearAll': 'Verlauf löschen',
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
