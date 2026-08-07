'use client';

import { useEffect, useState } from 'react';
import { Heart, History, MessageCircle, Upload, User } from 'lucide-react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { authApi } from '@/lib/api';
import { getStoredUser, storeUser } from '@/lib/auth/session';
import type { TelegramUploadMode } from '@/lib/api/types';
import { cn } from '@/lib/utils';

const UPLOAD_MODE_OPTIONS: Array<{
  value: TelegramUploadMode;
  label: string;
  description: string;
}> = [
  {
    value: 'single',
    label: 'Single videos',
    description:
      'Each upload is independent. AI picks category per video unless you set Category in the caption.',
  },
  {
    value: 'caption',
    label: 'Course / batch (caption)',
    description:
      'Use "Batch: Course Name" in every caption. Videos with the same batch name are grouped and share category and creator.',
  },
  {
    value: 'session',
    label: 'Session (/batch command)',
    description:
      'Run /batch in Telegram, forward videos, then /batch end. No need to repeat the batch name on every file.',
  },
  {
    value: 'album',
    label: 'Album auto',
    description:
      'Forward multiple videos as one Telegram album; they are grouped automatically.',
  },
];

const links = [
  {
    href: '/profile/videos',
    label: 'My Videos',
    description: 'Edit, delete, and manage your uploads',
    icon: Upload,
    accent: 'bg-red-500/15 text-red-400 ring-red-500/20',
  },
  {
    href: '/profile/batches',
    label: 'My Courses / Batches',
    description: 'View grouped uploads from Telegram batches',
    icon: Upload,
    accent: 'bg-violet-500/15 text-violet-400 ring-violet-500/20',
  },
  {
    href: '/history',
    label: 'Watch History',
    description: 'Continue where you left off',
    icon: History,
    accent: 'bg-blue-500/15 text-blue-400 ring-blue-500/20',
  },
  {
    href: '/favorites',
    label: 'Favorites',
    description: 'Videos you saved for later',
    icon: Heart,
    accent: 'bg-red-500/15 text-red-400 ring-red-500/20',
  },
];

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data &&
    typeof err.response.data.message === 'string'
  ) {
    return err.response.data.message;
  }
  return fallback;
}

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const [displayName, setDisplayName] = useState(storedUser?.displayName ?? '');
  const [telegramLinked, setTelegramLinked] = useState(storedUser?.telegramLinked ?? false);
  const [linkCode, setLinkCode] = useState<string | null>(storedUser?.telegramLinkCode ?? null);
  const [linkCodeExpiresAt, setLinkCodeExpiresAt] = useState<string | null>(
    storedUser?.telegramLinkCodeExpiresAt ?? null,
  );
  const [telegramUploadMode, setTelegramUploadMode] = useState<TelegramUploadMode>(
    storedUser?.telegramUploadMode ?? 'caption',
  );
  const [saving, setSaving] = useState(false);
  const [savingMode, setSavingMode] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyUser = (user: Awaited<ReturnType<typeof authApi.me>>) => {
    storeUser(user);
    setDisplayName(user.displayName);
    setTelegramLinked(Boolean(user.telegramLinked));
    setLinkCode(user.telegramLinkCode ?? null);
    setLinkCodeExpiresAt(user.telegramLinkCodeExpiresAt ?? null);
    setTelegramUploadMode(user.telegramUploadMode ?? 'caption');
  };

  useEffect(() => {
    authApi.me().then(applyUser).catch(() => undefined);
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const user = await authApi.updateProfile({
        displayName: displayName.trim(),
      });
      applyUser(user);
      setMessage('Profile updated');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update profile. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = async (mode: TelegramUploadMode) => {
    setTelegramUploadMode(mode);
    setSavingMode(true);
    setMessage(null);
    setError(null);
    try {
      const user = await authApi.updateProfile({ telegramUploadMode: mode });
      applyUser(user);
      setMessage('Upload mode updated');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update upload mode.'));
    } finally {
      setSavingMode(false);
    }
  };

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    setMessage(null);
    setError(null);
    try {
      const result = await authApi.createTelegramLinkCode();
      setLinkCode(result.code);
      setLinkCodeExpiresAt(result.expiresAt);
      const user = await authApi.me();
      applyUser(user);
      setMessage('Link code generated. Paste it in the Telegram bot within 15 minutes.');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not generate link code.'));
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    setMessage(null);
    setError(null);
    try {
      const user = await authApi.unlinkTelegram();
      applyUser(user);
      setLinkCode(null);
      setLinkCodeExpiresAt(null);
      setMessage('Telegram unlinked');
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not unlink Telegram.'));
    } finally {
      setUnlinking(false);
    }
  };

  const handleCopyCode = async () => {
    if (!linkCode) return;
    try {
      await navigator.clipboard.writeText(linkCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy code to clipboard');
    }
  };

  return (
    <PageLayout>
      <PageHeader icon={User} title="Profile" subtitle="Your account and library" accent="zinc" />

      <form onSubmit={handleSave} className="pro-card mb-6 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-accent" />
          <h2 className="font-medium text-white">Account settings</h2>
        </div>
        {storedUser && (
          <p className="mb-4 text-sm text-yt-text-tertiary">{storedUser.email}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-yt-text-secondary">Display name</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="pro-input"
            />
          </div>

          <div className="rounded-xl border border-yt-border bg-yt-surface-raised/50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Telegram upload bot</p>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  telegramLinked
                    ? 'bg-green-500/15 text-green-400 ring-1 ring-green-500/20'
                    : 'bg-yt-hover text-yt-text-secondary',
                )}
              >
                {telegramLinked ? 'Linked' : 'Not linked'}
              </span>
            </div>
            <p className="mb-3 text-xs text-yt-text-tertiary">
              Generate a one-time code here, then paste it in the Telegram upload bot to link this
              account.
            </p>

            {linkCode && (
              <div className="mb-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-yt-border-input bg-yt-bg px-3 py-2 font-mono text-sm text-white">
                  {linkCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="pro-btn pro-btn-secondary px-3 py-2"
                  aria-label="Copy link code"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            {linkCodeExpiresAt && !telegramLinked && (
              <p className="mb-3 text-xs text-yt-text-tertiary">
                Code expires {new Date(linkCodeExpiresAt).toLocaleString()}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={generatingCode}
                className="pro-btn pro-btn-primary"
              >
                {generatingCode ? 'Generating...' : linkCode ? 'Generate new code' : 'Generate link code'}
              </button>
              {telegramLinked && (
                <button
                  type="button"
                  onClick={handleUnlink}
                  disabled={unlinking}
                  className="pro-btn pro-btn-secondary"
                >
                  {unlinking ? 'Unlinking...' : 'Unlink Telegram'}
                </button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-yt-border bg-yt-surface-raised/50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">Telegram upload grouping</p>
              {savingMode && <span className="text-xs text-yt-text-tertiary">Saving...</span>}
            </div>
            <div className="space-y-2">
              {UPLOAD_MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    'flex cursor-pointer gap-3 rounded-lg border p-3 transition',
                    telegramUploadMode === option.value
                      ? 'border-accent/50 bg-accent/10'
                      : 'border-yt-border hover:bg-yt-hover/40',
                  )}
                >
                  <input
                    type="radio"
                    name="telegramUploadMode"
                    value={option.value}
                    checked={telegramUploadMode === option.value}
                    onChange={() => void handleModeChange(option.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-white">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-yt-text-tertiary">
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-yt-text-tertiary">
              You can also change this in Telegram with <code>/mode caption</code>,{' '}
              <code>/mode session</code>, etc.
            </p>
          </div>

          {message && <p className="text-sm text-green-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={saving} className="pro-btn pro-btn-secondary">
            {saving ? 'Saving...' : 'Save display name'}
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.map(({ href, label, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="pro-card group flex items-start gap-3 p-4 transition hover:bg-yt-hover/40"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-white group-hover:text-neutral-100">{label}</p>
              <p className="mt-0.5 text-xs text-yt-text-tertiary sm:text-sm">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
