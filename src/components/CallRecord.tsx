import React, { useState } from 'react';
import { ChevronDown, ChevronRight, History, Mic, Keyboard, Undo2 } from 'lucide-react';
import type { CallTimeline } from '../engine/callTimeline';

/**
 * The call record — what was said, what was taken back, and what this decision
 * is actually based on.
 *
 * ## Why this exists
 *
 * Stage 7 gave the engine a memory of the conversation: a withdrawal supersedes
 * an earlier claim, and a flipped finding is reported. But all of it reached the
 * operator as a 10px badge with the detail hidden in a `title=` tooltip.
 *
 * That is not good enough, for two reasons:
 *
 * 1. **There is no hover on a tablet.** A dispatch console is very likely to be
 *    touched, and the single most important event in a call — the caller
 *    withdrawing "he is not breathing" — was invisible without a mouse.
 * 2. **The decision input was never shown at all.** The screen displayed the
 *    LATEST utterance, while the decision ran on the corrected picture. So the
 *    operator could see a retraction happen and had no way to see what replaced
 *    it. For a tool whose entire value is that the operator can trust the
 *    screen, "what is this actually based on?" has to be answerable on screen.
 *
 * ## What it shows
 *
 * - every turn in order, marked spoken or typed
 * - withdrawn turns struck through, so history is never silently rewritten
 * - what changed, in words
 * - and the effective transcript, labelled as the decision input
 *
 * Collapsed by default so it never pushes the protocol off screen; auto-opened
 * when the call changes, because that is exactly when someone needs to read it.
 */

export interface CallRecordProps {
  timeline: CallTimeline | null;
  /** The transcript the decision is actually based on. */
  matchText: string;
  notes: string[];
  /** Answer source per question id, so voice and tap answers are distinguishable. */
  answerSources?: Record<string, 'voice' | 'tap'>;
}

export const CallRecord: React.FC<CallRecordProps> = ({
  timeline,
  matchText,
  notes,
  answerSources = {},
}) => {
  const utterances = timeline?.utterances ?? [];
  const changed = notes.length > 0;
  // Open by default the moment something changes, then respect the operator.
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const expanded = touched ? open : changed;

  if (utterances.length === 0) return null;

  const superseded = new Set(timeline?.superseded ?? []);
  const reduced = timeline?.reduced ?? {};

  return (
    <section
      data-testid="call-record"
      className="rounded-xl border border-slate-200 bg-white/70 shadow-xs overflow-hidden"
    >
      <button
        type="button"
        data-testid="call-record-toggle"
        onClick={() => {
          setTouched(true);
          setOpen((v) => !v);
        }}
        aria-expanded={expanded}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-50 cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
        )}
        <History className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-700">
          Call record
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          {utterances.length} turn{utterances.length === 1 ? '' : 's'}
        </span>
        {changed && (
          <span className="ml-auto text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-amber-400 bg-amber-100 text-amber-900">
            updated &times;{notes.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="px-2.5 pb-2.5 space-y-2 border-t border-slate-200">
          {notes.length > 0 && (
            <ul data-testid="call-record-notes" className="space-y-1" aria-live="polite">
              {notes.map((n, i) => (
                <li key={i} className="text-[11px] font-mono text-amber-900 leading-snug">
                  {n}
                </li>
              ))}
            </ul>
          )}

          <ol data-testid="call-record-turns" className="space-y-1">
            {utterances.map((u) => {
              const isSuperseded = superseded.has(u.seq);
              const reducedText = reduced[u.seq];
              const partial = Boolean(reducedText);
              return (
                <li key={u.seq} className="flex items-start gap-1.5 text-[11px] font-mono">
                  <span className="shrink-0 mt-0.5 text-slate-400" aria-hidden="true">
                    {u.source === 'mic' ? (
                      <Mic className="w-3 h-3" />
                    ) : (
                      <Keyboard className="w-3 h-3" />
                    )}
                  </span>
                  <span className="sr-only">{u.source === 'mic' ? 'spoken: ' : 'typed: '}</span>
                  <span
                    className={
                      isSuperseded
                        ? 'text-slate-400 line-through'
                        : partial
                          ? 'text-slate-700'
                          : 'text-slate-800'
                    }
                  >
                    {u.text}
                  </span>
                  {isSuperseded && (
                    <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      <Undo2 className="w-2.5 h-2.5" aria-hidden="true" />
                      withdrawn
                    </span>
                  )}
                  {partial && (
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      partly taken back — kept: &ldquo;{reducedText}&rdquo;
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {Object.keys(answerSources).length > 0 && (
            <p className="text-[10px] font-mono text-slate-500">
              Answers:{' '}
              {Object.entries(answerSources)
                .map(([q, src]) => `${q} (${src})`)
                .join(', ')}
            </p>
          )}

          <div className="pt-1.5 border-t border-slate-200">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
              What this decision is based on
            </p>
            <p data-testid="call-record-match" className="text-[11px] font-mono text-slate-800 leading-snug mt-0.5">
              {matchText || <span className="text-slate-400">nothing — everything was withdrawn</span>}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
