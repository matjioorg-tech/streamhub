import { AdminLoginForm } from '@/components/auth/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-8 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-xl sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-red-500">
            StreamHub
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin Login</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Sign in with your administrator account to manage videos and uploads.
          </p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
