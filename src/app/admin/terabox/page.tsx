'use client';

import { FormEvent, useState } from 'react';
import {
  useTeraboxSettings,
  useSaveTeraboxCookie,
  useTestTeraboxLink,
} from '@/hooks/use-admin';
import { formatBytes } from '@/lib/utils';

const DEFAULT_TEST_URL = 'https://teraboxlink.com/s/14vnNJGyjQyHf5mVq6bCdsg';

export default function AdminTeraboxPage() {
  const { data: settings, isLoading, refetch } = useTeraboxSettings();
  const saveCookie = useSaveTeraboxCookie();
  const testLink = useTestTeraboxLink();

  const [cookie, setCookie] = useState('');
  const [testUrl, setTestUrl] = useState(DEFAULT_TEST_URL);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await saveCookie.mutateAsync(cookie.trim());
      setCookie('');
      setMessage('TeraBox cookie saved. The bot will use it for share links.');
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cookie');
    }
  };

  const handleTest = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await testLink.mutateAsync({
        url: testUrl,
        cookie: cookie.trim() || undefined,
      });
      if (result.ok) {
        setMessage(
          `Test passed: ${result.fileName ?? 'video'}${result.size ? ` (${formatBytes(result.size)})` : ''}`,
        );
      } else {
        setError(result.error ?? 'TeraBox test failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'TeraBox test failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">TeraBox</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Paste your browser cookie from terabox.com. The Telegram bot uses it to download
          videos from TeraBox share links.
        </p>
      </div>

      {isLoading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
          <p>
            Status:{' '}
            <span className={settings?.configured ? 'text-green-400' : 'text-amber-400'}>
              {settings?.configured ? 'Configured' : 'Not configured'}
            </span>
          </p>
          {settings?.cookiePreview && (
            <p className="mt-2 text-zinc-400">Current: {settings.cookiePreview}</p>
          )}
          {settings?.updatedAt && (
            <p className="mt-1 text-zinc-500">
              Updated: {new Date(settings.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 rounded-xl border border-zinc-800 p-4">
        <div>
          <label htmlFor="cookie" className="mb-2 block text-sm font-medium">
            Browser cookie
          </label>
          <textarea
            id="cookie"
            value={cookie}
            onChange={(e) => setCookie(e.target.value)}
            rows={6}
            placeholder="browserid=...; lang=en; ndus=...; ndut_fmt=...; ..."
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <p className="mt-2 text-xs text-zinc-500">
            In Chrome: open terabox.com → DevTools → Application → Cookies → copy all as
            name=value pairs separated by semicolons.
          </p>
        </div>

        <div>
          <label htmlFor="testUrl" className="mb-2 block text-sm font-medium">
            Test link
          </label>
          <input
            id="testUrl"
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={testLink.isPending || (!cookie.trim() && !settings?.configured)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800 disabled:opacity-50"
          >
            {testLink.isPending ? 'Testing...' : 'Test link'}
          </button>
          <button
            type="submit"
            disabled={saveCookie.isPending || !cookie.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-50"
          >
            {saveCookie.isPending ? 'Saving...' : 'Save cookie'}
          </button>
        </div>
      </form>

      {message && <p className="text-sm text-green-400">{message}</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
