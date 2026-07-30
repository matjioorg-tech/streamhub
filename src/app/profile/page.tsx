'use client';

import { Heart, History, User } from 'lucide-react';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { PageHeader } from '@/components/layout/page-header';

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
  return (
    <PageLayout>
      <PageHeader
        icon={User}
        title="Profile"
        subtitle="Your account and library"
        accent="zinc"
      />

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
