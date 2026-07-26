'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { setSession } from '@/lib/auth/session';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    try {
      const result = await authApi.login(data.email, data.password);
      if (result.user.role !== 'admin') {
        setError('This account does not have admin access.');
        return;
      }
      setSession(result.tokens, result.user);
      router.replace('/admin');
    } catch {
      setError('Invalid email or password');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Email</label>
        <input
          {...register('email')}
          type="email"
          autoComplete="username"
          className={cn(
            'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
            'focus:border-red-500 focus:outline-none',
          )}
        />
        {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Password</label>
        <input
          {...register('password')}
          type="password"
          autoComplete="current-password"
          className={cn(
            'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
            'focus:border-red-500 focus:outline-none',
          )}
        />
        {errors.password && (
          <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-red-600 py-2.5 font-medium text-white hover:bg-red-500 disabled:opacity-50"
      >
        {isSubmitting ? 'Signing in...' : 'Sign in to Admin'}
      </button>
    </form>
  );
}
