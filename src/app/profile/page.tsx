'use client';

import { useEffect, useState } from 'react';
import { Heart, History, User, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';
import { authApi } from '@/lib/api';
import { getStoredUser, storeUser } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

const links = [
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

export default function ProfilePage() {
  const storedUser = getStoredUser();
  const [telegramChatId, setTelegramChatId] = useState(storedUser?.telegramChatId ?? '');
  const [displayName, setDisplayName] = useState(storedUser?.displayName ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi.me().then((user) => {
      storeUser(user);
      setDisplayName(user.displayName);
      setTelegramChatId(user.telegramChatId ?? '');
    }).catch(() => undefined);
  }, []);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const user = await authApi.updateProfile({
        displayName: displayName.trim(),
        telegramChatId: telegramChatId.trim() || null,
      });
      storeUser(user);
      setMessage('Profile updated');
    } catch {
      setError('Could not update profile. Telegram chat ID may already be linked.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageLayout>
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Your account and library"
        accent="zinc"
      />

      <form
        onSubmit={handleSave}
        className="mb-6 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4 sm:p-5"
      >
        <div className="mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-red-400" />
          <h2 className="font-medium text-white">Account settings</h2>
        </div>
        {storedUser && (
          <p className="mb-4 text-sm text-zinc-500">{storedUser.email}</p>
        )}
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Display name</label>
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className={cn(
                'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
                'focus:border-red-500 focus:outline-none',
              )}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-400">Telegram chat ID</label>
            <input
              value={telegramChatId}
              onChange={(event) => setTelegramChatId(event.target.value)}
              placeholder="e.g. 769012328"
              className={cn(
                'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
                'focus:border-red-500 focus:outline-none',
              )}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Link your Telegram chat so the upload bot routes videos to your account.
              Send a message to the bot and use the chat ID it shows if unlinked.
            </p>
          </div>
          {message && <p className="text-sm text-green-400">{message}</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>

      <div className="grid gap-3 sm:grid-cols-2">
        {links.map(({ href, label, description, icon: Icon, accent }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-start gap-3 rounded-2xl border border-zinc-800/80 bg-zinc-950/50 p-4 transition active:scale-[0.99] hover:border-zinc-700 hover:bg-zinc-900/50"
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${accent}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-white group-hover:text-red-300">{label}</p>
              <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </PageLayout>
  );
}
