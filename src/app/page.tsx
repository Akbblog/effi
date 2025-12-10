
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import LoginPage from './(auth)/login/page';

import AnimatedBackground from '@/components/ui/AnimatedBackground';

import Logo from '@/components/ui/Logo';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-gray-50">
        <AnimatedBackground variant="minimal" />

        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
            <Logo size="lg" animated={false} />
          </div>

          <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-red-500" />
            Initializing...
          </div>
        </div>
      </div>
    );
  }

  // Default to Login Page View if not authenticated
  return <LoginPage />;
}
