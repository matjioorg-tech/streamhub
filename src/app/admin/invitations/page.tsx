'use client';

import { FormEvent, useState } from 'react';
import {
  useAdminInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useResendInvitation,
} from '@/hooks/use-admin';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

function statusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-blue-900/50 text-blue-300';
    case 'accepted':
      return 'bg-green-900/50 text-green-300';
    case 'expired':
      return 'bg-zinc-800 text-zinc-400';
    case 'revoked':
      return 'bg-amber-900/50 text-amber-300';
    default:
      return 'bg-zinc-800 text-zinc-400';
  }
}

export default function AdminInvitationsPage() {
  const { data: invitations, isLoading } = useAdminInvitations();
  const createInvitation = useCreateInvitation();
  const revokeInvitation = useRevokeInvitation();
  const resendInvitation = useResendInvitation();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{
    id: string;
    email: string;
  } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const invitation = await createInvitation.mutateAsync(email.trim());
      setEmail('');
      setMessage(
        invitation.emailSent
          ? `Invitation email sent to ${invitation.email}.`
          : `Invitation created for ${invitation.email}. Email not sent — set RESEND_API_KEY in backend .env, or copy the link below.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    }
  };

  const handleCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError('Could not copy link to clipboard');
    }
  };

  const runRevoke = async () => {
    if (!revokeTarget) return;
    setError(null);
    try {
      await revokeInvitation.mutateAsync(revokeTarget.id);
      setMessage(`Invitation for ${revokeTarget.email} revoked.`);
      setRevokeTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke invitation');
    }
  };

  const handleResend = async (id: string, inviteEmail: string) => {
    setError(null);
    setMessage(null);
    try {
      const result = await resendInvitation.mutateAsync(id);
      setMessage(
        result.emailSent
          ? `Invitation email resent to ${inviteEmail}.`
          : `Could not send email. Check RESEND_API_KEY configuration.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  };

  return (
    <>
      <h1 className="mb-2 text-2xl font-bold">Admin Invitations</h1>
      <p className="mb-6 text-sm text-zinc-400">
        Invite others to join as administrators. An email with the invite link is sent via Resend.
      </p>

      {message && (
        <div className="mb-4 rounded-lg border border-green-800 bg-green-950/50 px-4 py-3 text-sm text-green-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 sm:flex-row sm:items-end"
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-zinc-400">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="newadmin@example.com"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={createInvitation.isPending}
          className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {createInvitation.isPending ? 'Sending...' : 'Send invitation'}
        </button>
      </form>

      {isLoading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : !invitations?.length ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-400">
          No invitations yet.
        </div>
      ) : (
        <div className="space-y-3">
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-5"
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{invitation.email}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Invited by {invitation.invitedByEmail ?? 'unknown'} · expires{' '}
                    {new Date(invitation.expiresAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusColor(invitation.status)}`}>
                  {invitation.status}
                </span>
              </div>

              {invitation.status === 'pending' && (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={invitation.inviteUrl}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResend(invitation.id, invitation.email)}
                      disabled={resendInvitation.isPending}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Resend email
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(invitation.id, invitation.inviteUrl)}
                      className="rounded-lg border border-zinc-700 px-3 py-2 text-xs hover:bg-zinc-800"
                    >
                      {copiedId === invitation.id ? 'Copied!' : 'Copy link'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeTarget({ id: invitation.id, email: invitation.email })
                      }
                      disabled={revokeInvitation.isPending}
                      className="rounded-lg border border-red-900 px-3 py-2 text-xs text-red-400 hover:bg-red-950 disabled:opacity-50"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {revokeTarget && (
        <ConfirmDialog
          title="Revoke invitation?"
          description={`Revoke invitation for ${revokeTarget.email}?`}
          confirmLabel="Revoke"
          loading={revokeInvitation.isPending}
          onCancel={() => setRevokeTarget(null)}
          onConfirm={() => void runRevoke()}
        />
      )}
    </>
  );
}
