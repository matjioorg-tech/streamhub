'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { authApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    try {
      const result = await authApi.register(data.email, data.password, data.displayName);
      localStorage.setItem('accessToken', result.tokens.accessToken);
      localStorage.setItem('refreshToken', result.tokens.refreshToken);
      router.push('/');
    } catch {
      setError('Registration failed. Email may already be in use.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Display Name</label>
        <input
          {...register('displayName')}
          className={cn(
            'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
            'focus:border-red-500 focus:outline-none',
          )}
        />
        {errors.displayName && (
          <p className="mt-1 text-xs text-red-400">{errors.displayName.message}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-400">Email</label>
        <input
          {...register('email')}
          type="email"
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
          className={cn(
            'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white',
            'focus:border-red-500 focus:outline-none',
          )}
        />
        {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-red-600 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {isSubmitting ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  );
}
