import React, { useMemo, useState } from 'react';
import { BarChart3, RotateCcw, Sparkles, Trophy, Zap, Flame } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/lib/settings';
import { loadHistory, accuracyOf, type QuizResult } from '@/src/lib/progress';

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function ratingFor(accuracy: number | null, bestStreak: number): { label: string; emoji: string } {
  if (accuracy === null) return { label: 'Fresh', emoji: '🌱' };
  if (accuracy >= 90 && bestStreak >= 10) return { label: 'Master', emoji: '🏆' };
  if (accuracy >= 80) return { label: 'Strong', emoji: '🔥' };
  if (accuracy >= 60) return { label: 'Solid', emoji: '⚡' };
  if (accuracy >= 40) return { label: 'Improving', emoji: '🌱' };
  return { label: 'Warming up', emoji: '🙂' };
}

export function Progress() {
  const { t } = useSettings();
  const [history, setHistory] = useState<QuizResult[]>(() => loadHistory());

  const stats = useMemo(() => {
    const games = history.length;
    const totalScore = history.reduce((s, r) => s + r.score, 0);
    const bestScore = history.reduce((s, r) => Math.max(s, r.score), 0);
    const bestStreak = history.reduce((s, r) => Math.max(s, r.bestStreak), 0);
    const totalCorrect = history.reduce((s, r) => s + r.correct, 0);
    const totalTried = history.reduce((s, r) => s + r.tried, 0);
    const overallAccuracy = totalTried > 0 ? Math.round((totalCorrect / totalTried) * 100) : null;
    return { games, totalScore, bestScore, bestStreak, overallAccuracy };
  }, [history]);

  const rating = ratingFor(stats.overallAccuracy, stats.bestStreak);

  // Best score per scenario to show where to improve.
  const bestPerScenario = useMemo(() => {
    const map = new Map<string, QuizResult>();
    for (const r of history) {
      const key = `${r.operation}|${r.digitMode}|${r.duration}`;
      const existing = map.get(key);
      if (!existing || r.score > existing.score) map.set(key, r);
    }
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }, [history]);

  const clearAll = () => {
    window.localStorage.removeItem('calcroom-quiz-history');
    setHistory([]);
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto px-6 py-8 gap-5 overflow-y-auto">
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <BarChart3 className="w-5 h-5 text-tertiary" />
          <h1 className="text-3xl font-black tracking-tight text-on-surface">{t('progress.title')}</h1>
        </div>
        <p className="text-on-surface-variant text-xs font-medium">{t('progress.subtitle')}</p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-4 py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-on-surface-variant" />
          </div>
          <p className="text-on-surface-variant text-sm font-medium">{t('progress.empty')}</p>
          <p className="text-on-surface-variant/60 text-xs">{t('progress.emptyHint')}</p>
        </div>
      ) : (
        <>
          {/* Rating card */}
          <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 text-center space-y-1">
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">{t('progress.rateTitle')}</p>
            <p className="text-5xl">{rating.emoji}</p>
            <p className="text-xl font-black text-on-surface">{rating.label}</p>
            <p className="text-xs text-on-surface-variant font-medium">
              {stats.overallAccuracy !== null && <>{t('progress.accuracy', { n: stats.overallAccuracy })} · </>}
              {t('progress.bestStreak', { n: stats.bestStreak })}
            </p>
          </div>

          {/* Overall stats */}
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t('progress.games')} value={String(stats.games)} />
            <StatCard label={t('progress.totalPoints')} value={String(stats.totalScore)} />
            <StatCard label={t('progress.bestScore')} value={String(stats.bestScore)} />
            <StatCard label={t('progress.accuracy')} value={stats.overallAccuracy !== null ? `${stats.overallAccuracy}%` : '—'} />
          </div>

          {/* Best per scenario */}
          {bestPerScenario.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">{t('progress.bestPerScenario')}</p>
              <div className="space-y-2">
                {bestPerScenario.slice(0, 5).map(r => (
                  <div
                    key={r.id}
                    className="w-full flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl px-4 py-3"
                  >
                    <Trophy className="w-5 h-5 text-tertiary shrink-0" />
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-bold text-on-surface truncate">
                        {t(`quiz.op.${r.operation}`)} · {t(`quiz.digits.${r.digitMode}`)}
                      </p>
                      <p className="text-[11px] text-on-surface-variant">
                        {t('progress.pointsShort', { n: r.score })} · {r.bestStreak}x
                        {accuracyOf(r) !== null && <> · {accuracyOf(r)}%</>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent history */}
          <div className="w-full space-y-2">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider px-1">{t('progress.recent')}</p>
            <div className="space-y-2">
              {history.slice(0, 12).map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-surface-container border border-outline-variant rounded-xl px-4 py-3">
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    r.score > 0 ? "bg-tertiary/20 text-tertiary" : "bg-surface-container-high text-on-surface-variant"
                  )}>
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {r.score} {t('quiz.pointsScored')}
                    </p>
                    <p className="text-[11px] text-on-surface-variant truncate">
                      {t(`quiz.op.${r.operation}`)} · {t(`quiz.digits.${r.digitMode}`)} · {formatTime(r.duration)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-on-surface flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-tertiary" />
                      {r.bestStreak}x
                    </p>
                    <p className="text-[10px] text-on-surface-variant">{formatDate(r.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={clearAll}
            className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-on-surface-variant hover:text-red-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('progress.clearAll')}
          </button>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container border border-outline-variant rounded-2xl px-4 py-4 text-center">
      <p className="text-2xl font-black text-on-surface tracking-tight">{value}</p>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
