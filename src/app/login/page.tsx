import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Sign In</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-zinc-400">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-red-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
