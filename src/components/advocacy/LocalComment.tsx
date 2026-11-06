'use client';

import { useState } from 'react';

/**
 * Write a comment on a local case and send it yourself.
 *
 * Deliberately not our delivery pipeline. CWC carries letters to Congress and
 * the webform sender covers state offices; a city planning department has
 * neither, and six of the seven Reno council seats publish a web form rather
 * than an address. So this composes the message, stamps it with the case
 * number so it files correctly, and hands it over. Nothing is sent from here,
 * and the page says so.
 *
 * No position is suggested. The stance is the writer's, and the body starts
 * empty.
 */
export function LocalComment({
  caseNumber,
  projectName,
  plannerEmail,
  stance: fixedStance = 'neutral',
}: {
  caseNumber: string;
  projectName: string;
  plannerEmail: string;
  /** Not 'neutral' pins the position and hides the picker. */
  stance?: 'oppose' | 'support' | 'neutral';
}) {
  const [pickedStance, setStance] = useState<'support' | 'oppose' | 'questions' | ''>('');
  const stance = fixedStance === 'neutral' ? pickedStance : fixedStance;
  const [body, setBody] = useState('');
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [copied, setCopied] = useState(false);

  const stanceLine =
    stance === 'support'
      ? 'I support this application.'
      : stance === 'oppose'
        ? 'I oppose this application.'
        : stance === 'questions'
          ? 'I have questions about this application.'
          : '';

  const signature = [name.trim(), place.trim()].filter(Boolean).join(', ');
  const subject = `Public comment on ${caseNumber} (${projectName})`;
  const message = [
    'To the Reno Planning Commission,',
    '',
    `I am writing about case ${caseNumber}, ${projectName}.`,
    stanceLine,
    '',
    body.trim(),
    '',
    'Please enter this comment into the record for this case.',
    '',
    signature,
  ]
    .filter((line, i, all) => !(line === '' && all[i - 1] === ''))
    .join('\n')
    .trim();

  const ready = body.trim().length > 0;
  const mailto = `mailto:${plannerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  return (
    <div className="border border-gray-900 dark:border-gray-300 p-5">
      <p className="label mb-2">Write your comment</p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 max-w-[62ch]">
        {fixedStance === 'oppose'
          ? 'This builds a comment opposing the application, stamped with the case number so the city files it against the right one. The words are yours. You send it yourself, and nothing leaves this page.'
          : 'This builds a comment stamped with the case number so the city files it against the right application. You send it yourself. Nothing leaves this page.'}
      </p>

      {fixedStance === 'neutral' && (
      <fieldset className="mb-4">
        <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your position <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {([
            ['support', 'I support it'],
            ['oppose', 'I oppose it'],
            ['questions', 'I have questions'],
          ] as const).map(([val, label]) => (
            <label
              key={val}
              className={`px-3 py-2 border-2 text-sm font-medium cursor-pointer transition-colors ${
                stance === val
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="stance"
                value={val}
                checked={stance === val}
                onChange={() => setStance(val)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
      )}

      <label htmlFor="comment-body" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        What do you want them to know?
      </label>
      <textarea
        id="comment-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={7}
        placeholder="Your own words. What you have seen, how it affects you, what you want them to consider."
        className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 bg-surface dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
      />

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <div>
          <label htmlFor="comment-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Name <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
          </label>
          <input
            id="comment-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-surface dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
        <div>
          <label htmlFor="comment-place" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Neighborhood or city <span className="font-normal text-gray-500 dark:text-gray-400">(optional)</span>
          </label>
          <input
            id="comment-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            className="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 bg-surface dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        Comments on a land-use case become part of a public record.
      </p>

      {ready && (
        <pre className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 border border-rule dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {message}
        </pre>
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Add your thoughts above to enable these.</p>
      )}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
        Goes to {plannerEmail}, the planner on this case. Copy it to your council member too, since the Council takes
        the final vote.
      </p>
    </div>
  );
}
