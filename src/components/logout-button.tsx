'use client';

import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();
  const auth = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Clear the authentication cookie
      document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="w-full justify-start"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Sair
    </Button>
  );
}