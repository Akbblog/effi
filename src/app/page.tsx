
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LoginPage from './(auth)/login/page';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>; // or null, since redirecting
  }

  // Default to Login Page View if not authenticated
  return <LoginPage />;
}
