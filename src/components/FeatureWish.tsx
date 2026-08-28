import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, Lightbulb, Send, X } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useSettings } from '@/src/lib/settings';

const FORM_URL = 'https://formsubmit.co/ajax/ryan.heinz@gmail.com';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function FeatureWish() {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  const reset = () => {
    setOpen(false);
    setStatus('idle');
    setMessage('');
    setEmail('');
    setErrorDetail('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '' || status === 'sending') return;
    setStatus('sending');
    setErrorDetail('');
    try {
      const body = new FormData();
      body.append('message', message.trim());
      if (email.trim()) body.append('email', email.trim());
      body.append('_subject', 'CalcRoom feature request');
      body.append('_template', 'table');
      body.append('_captcha', 'false');
      body.append('_honey', '');

      const res = await fetch(FORM_URL, { method: 'POST', body });
      const json = await res.json().catch(() => null);
      if (res.ok && json && String(json.success) === 'true') {
        setStatus('sent');
        return;
      }
      setStatus('error');
      if (json && typeof json.message === 'string') {
        setErrorDetail(json.message);
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setOpen(true);
          setStatus('idle');
        }}
        aria-label={t('app.wishTitle')}
        title={t('app.wishTitle')}
        className="p-2 rounded-lg hover:bg-surface-container-high transition-colors active:scale-95 duration-100"
      >
        <Lightbulb className="w-5 h-5 text-on-surface-variant" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={reset} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.18 }}
              className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-2xl p-6 space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">CalcRoom</p>
                  <h2 className="text-lg font-black tracking-tight text-on-surface">{t('app.wishTitle')}</h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t('app.wishSubtitle')}</p>
                </div>
                <button
                  onClick={reset}
                  aria-label={t('app.wishCancel')}
                  className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {status === 'sent' ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-tertiary/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-tertiary" />
                  </div>
                  <p className="text-sm font-semibold text-on-surface">{t('app.wishSent')}</p>
                  <button
                    onClick={reset}
                    className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                  >
                    {t('app.wishClose')}
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-3">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t('app.wishPlaceholder')}
                    rows={4}
                    required
                    className="w-full resize-none bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('app.wishEmailPlaceholder')}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary transition-colors"
                  />
                  {status === 'error' && (
                    <p className="flex items-start gap-1.5 text-xs font-semibold text-red-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                      <span>{errorDetail || t('app.wishError')}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={reset}
                      className="flex-1 h-11 rounded-xl bg-surface-container border border-outline-variant text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors"
                    >
                      {t('app.wishCancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={status === 'sending' || message.trim() === ''}
                      className={cn(
                        "flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-1.5 transition-colors",
                        (status === 'sending' || message.trim() === '') && "opacity-50"
                      )}
                    >
                      {status === 'sending' ? (
                        <span className="w-4 h-4 border-2 border-on-primary/40 border-t-on-primary rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {t('app.wishSubmit')}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}