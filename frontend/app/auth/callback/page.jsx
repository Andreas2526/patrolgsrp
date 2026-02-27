'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { persistSessionToken } from '../../../lib/sessionToken';

export default function DiscordAuthCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    const token = searchParams.get('token');

    if (!token) {
      router.replace('/login?error=missing_session_token');
      return;
    }

    persistSessionToken(token);
    router.replace('/login?connected=discord');
  }, [router, searchParams]);

  return <p>Completing Discord sign-in…</p>;
}
