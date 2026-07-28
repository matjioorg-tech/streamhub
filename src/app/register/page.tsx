import Link from 'next/link';
import { PageLayout } from '@/components/layout/page-layout';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <PageLayout hideMobileNav>
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">Create Account</h1>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-zinc-400">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
