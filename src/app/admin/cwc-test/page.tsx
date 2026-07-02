'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface Config {
  configured: boolean;
  baseUrl: string | null;
  deliveryAgentId: string | null;
  apiKeyPresent: boolean;
}

interface TestResult {
  ok: boolean;
  status: string;
  cwcMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  requestXml: string | null;
  rawResponse: string | null;
}

const FIELDS = [
  { key: 'office', label: 'Office / Bioguide ID', placeholder: 'e.g. A000370' },
  { key: 'name', label: 'Sender name', placeholder: 'Jane Doe' },
  { key: 'email', label: 'Email', placeholder: 'jane@example.com' },
  { key: 'street', label: 'Street', placeholder: '123 Main St' },
  { key: 'city', label: 'City', placeholder: 'Reno' },
  { key: 'state', label: 'State', placeholder: 'NV' },
  { key: 'zip', label: 'ZIP', placeholder: '89501' },
  { key: 'phone', label: 'Phone (optional)', placeholder: '775-555-0100' },
  { key: 'topic', label: 'Topic', placeholder: 'Environment' },
] as const;

const DEFAULTS: Record<string, string> = {
  office: '',
  name: 'Test Constituent',
  email: 'test@example.com',
  street: '123 Test St',
  city: 'Reno',
  state: 'NV',
  zip: '89501',
  phone: '',
  topic: 'Test submission',
  messageBody: 'This is a test message submitted via the CWC diagnostics page.',
};

export default function CwcTestPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(DEFAULTS);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cwc-test')
      .then(async (res) => {
        if (res.status === 403) {
          setForbidden(true);
          return null;
        }
        return res.json();
      })
      .then((data) => data && setConfig(data))
      .catch(() => setError('Failed to load config'));
  }, []);

  const setField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/admin/cwc-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  if (forbidden) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-red-600 dark:text-red-400">Forbidden — admin only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">CWC Diagnostics</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Fire a single Communicating With Congress submission and inspect the exact request XML + response.
        Bypasses the compliance gate. Use only against the CWC <strong>test</strong> environment.
      </p>

      {/* Config banner */}
      {config && (
        <div
          className={`mb-6 p-3 rounded-lg text-sm border ${
            config.configured
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
          }`}
        >
          {config.configured ? (
            <>
              CWC configured. Base URL: <code>{config.baseUrl}</code>, delivery agent:{' '}
              <code>{config.deliveryAgentId}</code>, API key present: {config.apiKeyPresent ? 'yes' : 'no'}.
            </>
          ) : (
            <>Not configured in this environment. Set CWC_API_KEY / CWC_API_BASE_URL / CWC_DELIVERY_AGENT_ID.</>
          )}
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
            <input
              value={form[f.key] ?? ''}
              onChange={(e) => setField(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message</label>
        <textarea
          value={form.messageBody ?? ''}
          onChange={(e) => setField('messageBody', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
        />
      </div>

      <Button onClick={submit} isLoading={loading} disabled={!config?.configured}>
        Send test submission
      </Button>

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div
            className={`p-3 rounded-lg text-sm border ${
              result.ok
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
            }`}
          >
            Status: <strong>{result.status}</strong>
            {result.cwcMessageId && <> · id: <code>{result.cwcMessageId}</code></>}
            {result.errorCode && <> · {result.errorCode}: {result.errorMessage}</>}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Request XML</p>
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {result.requestXml ?? '(none)'}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Raw response</p>
            <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto whitespace-pre-wrap">
              {result.rawResponse ?? '(none)'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
