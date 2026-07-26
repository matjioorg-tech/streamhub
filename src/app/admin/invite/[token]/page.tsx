'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { setSession } from '@/lib/auth/session';
import type { InvitationPreview } from '@/lib/api/types';
import { cn } from '@/lib/utils';

export default function AcceptInvitationPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params.token;

  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    authApi
      .previewInvitation(token)
      .then((data) => {
        setPreview(data);
        setError(null);
      })
      .catch(() => {
        setError('This invitation is invalid, expired, or has already been used.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await authApi.acceptInvitation(token, displayName, password);
      setSession(result.tokens, result.user);
      router.replace('/admin');
    } catch {
      setError('Could not accept invitation. It may have expired or been revoked.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Loading invitation...
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h1 className="text-xl font-bold text-white">Invalid invitation</h1>
          <p className="mt-3 text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 shadow-xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-red-500">
            StreamHub Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Accept invitation</h1>
          <p className="mt-2 text-sm text-zinc-400">
            You&apos;ve been invited
            {preview.invitedByName ? ` by ${preview.invitedByName}` : ''} to join as an administrator.
          </p>
          <p className="mt-1 text-sm font-medium text-white">{preview.email}</p>
        </div>

        {error && (
          <p className="mb-4 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Display name</span>
            <input
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white',
                'focus:border-red-500 focus:outline-none',
              )}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Password</span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white',
                'focus:border-red-500 focus:outline-none',
              )}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-400">Confirm password</span>
            <input
              required
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={cn(
                'w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white',
                'focus:border-red-500 focus:outline-none',
              )}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {submitting ? 'Creating account...' : 'Join as admin'}
          </button>
        </form>
      </div>
    </div>
  );
}
