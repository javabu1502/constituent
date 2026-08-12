'use client';

import { useState } from 'react';

/** Pilot application form for advocacy organizations (/campaigns). */
export function OrgAccessForm() {
  const [orgName, setOrgName] = useState('');
  const [website, setWebsite] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [workingOn, setWorkingOn] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('saving');
    try {
      const res = await fetch('/api/org-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_name: orgName.trim(),
          website: website.trim() || undefined,
          contact_name: contactName.trim(),
          email: email.trim(),
          role: role.trim() || undefined,
          working_on: workingOn.trim() || undefined,
        }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Application received</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Thanks — we review every pilot application personally and will reach out within a few days to set up a
          walkthrough with your team.
        </p>
      </div>
    );
  }

  const input =
    'w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400';

  return (
    <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <input required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name *" className={input} />
      <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website" className={input} />
      <input required value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Your name *" className={input} />
      <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Work email *" className={input} />
      <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role" className={`${input} sm:col-span-2`} />
      <textarea
        value={workingOn}
        onChange={(e) => setWorkingOn(e.target.value)}
        rows={3}
        placeholder="What are you working on? (a bill, an issue, a session — anything)"
        className={`${input} sm:col-span-2`}
      />
      {state === 'error' && (
        <p className="sm:col-span-2 text-sm text-rose-600 dark:text-rose-400">Something went wrong — please try again.</p>
      )}
      <button
        type="submit"
        disabled={state === 'saving'}
        className="sm:col-span-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {state === 'saving' ? 'Submitting…' : 'Apply for the pilot'}
      </button>
    </form>
  );
}
