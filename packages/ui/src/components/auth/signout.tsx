'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface SignOutProps {
  homeUrl: string
  signOut: () => void
}

export function SignOut({homeUrl, signOut}: SignOutProps): JSX.Element | null {
  const router = useRouter();

  useEffect(() => {
    signOut();
    router.push(homeUrl);
  })

  return null;
};
