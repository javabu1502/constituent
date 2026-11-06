'use client';

import { useState } from 'react';
import type { LocalAction } from '@/data/local-actions';

/**
 * Answer a few questions, attach the points you want, send it yourself.
 *
 * The interview is fixed questions rather than the AI guide used in the
 * contact flow. A comment on a land-use case goes into a public record under
 * the writer's name, so the facts in it should come from the case file and
 * the person's own experience, not from a model's paraphrase of either.
 *
 * Every attachable point carries its basis, including the two that are a
 * residents' account or a concern rather than a city finding. Someone putting
 * their name to a comment should know which is which.
 *
 * Nothing is sent from here. CWC carries letters to Congress and the webform
 * sender covers state offices; a city planning department has neither.
 */
export function LocalComment({ action }: { action: LocalAction }) {
  const { caseNumber, projectName, plannerEmail, stance, talkingPoints, interview } = action;

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<Set<number>>(new Set());
  const [pickedStance, setPickedStance] = useState<'support' | 'oppose' | 'questions' | ''>('');
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [place, setPlace] = useState('');
  const [copied, setCopied] = useState(false);

  const effective = stance === 'neutral' ? pickedStance : stance;
  const stanceLine =
    effective === 'support'
      ? 'I support this application.'
      : effective === 'oppose'
        ? 'I am writing to oppose this application.'
        : effective === 'questions'
          ? 'I have questions about this application.'
          : '';

  const toggle = (i: number) =>
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  const answered = interview.map((q) => answers[q.id]?.trim()).filter(Boolean) as string[];
  const points = [...chosen].sort((a, b) => a - b).map((i) => talkingPoints[i].point);
  // A planning commission weighs a comment by whether the writer lives with
  // the result, so the address earns its place here.
  const signature = [name.trim(), street.trim(), place.trim()].filter(Boolean).join('\n');

  const subject = `Public comment on ${caseNumber} (${projectName})`;
  const message = [
    'To the Reno Planning Commission,',
    '',
    `I am writing about case ${caseNumber}, ${projectName}.`,
    stanceLine,
    ...(answered.length ? ['', ...answered] : []),
    ...(points.length ? ['', 'The points I want on the record:', ...points.map((p) => `- ${p}`)] : []),
    '',
    'Please enter this comment into the record for this case.',
    '',
    signature,
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n')
    .trim();

  const ready = answered.length > 0 || points.length > 0;
  const mailto = `mailto:${plannerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  const field =
    'w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 bg-surface dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600';

  return (
    <div className="border border-gray-900 dark:border-gray-300 p-5">
      <p className="label mb-2">Write your comment</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-[62ch]">
        {stance === 'oppose'
          ? 'A few questions, then the points you want to attach. It builds a comment opposing the application, stamped with the case number so the city files it against the right one. The words are yours. You send it yourself, and nothing leaves this page.'
          : 'A few questions, then the points you want to attach. It builds a comment stamped with the case number so the city files it correctly. You send it yourself, and nothing leaves this page.'}
      </p>

      {stance === 'neutral' && (
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your position</legend>
          <div className="flex flex-wrap gap-2">
            {([
              ['support', 'I support it'],
              ['oppose', 'I oppose it'],
              ['questions', 'I have questions'],
            ] as const).map(([val, label]) => (
              <label
                key={val}
                className={`px-3 py-2 border-2 text-sm font-medium cursor-pointer transition-colors ${
                  pickedStance === val
                    ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="stance"
                  value={val}
                  checked={pickedStance === val}
                  onChange={() => setPickedStance(val)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="space-y-5">
        {interview.map((q, i) => (
          <div key={q.id}>
            <label htmlFor={`q-${q.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {i + 1}. {q.question}
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{q.hint}</p>
            <textarea
              id={`q-${q.id}`}
              rows={3}
              value={answers[q.id] ?? ''}
              onChange={(e) => setAnswers((p) => ({ ...p, [q.id]: e.target.value }))}
              className={field}
            />
          </div>
        ))}
      </div>

      <fieldset className="mt-7">
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Points you want on the record
        </legend>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[62ch]">
          Attach only what you are willing to stand behind. Each one says where it comes from.
        </p>
        <div className="space-y-2">
          {talkingPoints.map((tp, i) => (
            <label
              key={tp.point}
              className={`flex gap-3 p-3 border cursor-pointer transition-colors ${
                chosen.has(i)
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={chosen.has(i)}
                onChange={() => toggle(i)}
                className="mt-1 shrink-0 accent-purple-600"
              />
              <span>
                <span className="block text-sm leading-relaxed text-gray-800 dark:text-gray-200">{tp.point}</span>
                <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {tp.basis}
                  {tp.source && (
                    <>
                      {' · '}
                      <a
                        href={tp.source.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-700 dark:text-purple-300 hover:underline"
                      >
                        {tp.source.label}
                      </a>
                    </>
                  )}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-7">
        <p className="label mb-1">Who is writing</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 max-w-[62ch]">
          A planning commission weighs a comment by whether you live with the result, so an address carries real
          weight here. All of it is optional, and all of it becomes part of a public record.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Name
            </label>
            <input id="comment-name" value={name} onChange={(e) => setName(e.target.value)} className={field} />
          </div>
          <div>
            <label htmlFor="comment-street" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Street address
            </label>
            <input
              id="comment-street"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              autoComplete="street-address"
              className={field}
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="comment-place" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              City, state and ZIP
            </label>
            <input
              id="comment-place"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="Reno, NV 89506"
              className={field}
            />
          </div>
        </div>
      </div>

      {ready && (
        <>
          <p className="label mt-7 mb-2">Your comment</p>
          <pre className="p-4 bg-gray-50 dark:bg-gray-800 border border-rule dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {message}
          </pre>
        </>
      )}

      <div className="mt-4 flex flex-col sm:flex-row gap-3">
        <a
          href={ready ? mailto : undefined}
          aria-disabled={!ready}
          onClick={(e) => {
            if (!ready) e.preventDefault();
          }}
          className={`label-lg px-5 py-3 text-center transition-colors ${
            ready
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          Open in email
        </a>
        <button
          type="button"
          disabled={!ready}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(message);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className={`label-lg px-5 py-3 border text-center transition-colors ${
            ready
              ? 'border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-100 hover:bg-gray-900 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900'
              : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
          }`}
        >
          {copied ? 'Copied' : 'Copy message'}
        </button>
      </div>
      {!ready && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Answer a question or attach a point to enable these.
        </p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Goes to {plannerEmail}, the planner on this case. Copy your council member too, since the Council takes the
        final vote.
      </p>
    </div>
  );
}
