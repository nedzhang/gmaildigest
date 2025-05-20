'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Logo from '@/components/icons/Logo';
import { LogIn, LogOut } from 'lucide-react';
import { User } from 'lucide-react';
export default function Header() {
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  // This is a simplified auth check. In a real app, you'd use a proper auth state.
  // For now, we assume logged in if on dashboard.
  const isLoggedIn = isDashboard;

  return (
    <header className="bg-card/80 backdrop-blur-md sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-primary-foreground hover:text-accent-foreground transition-colors">
          <Logo className="w-8 h-8 text-primary" />
          Gmail Digest
        </Link>
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <Link href="/user-info" title="User Profile">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost"><LogOut className="mr-2 h-4 w-4" /> Logout</Button>
              </Link>
            </>
          ) : (
            pathname !== '/' && ( // Only show login if not on landing and not logged in
              <Link href="/">
                <Button>
                  <LogIn className="mr-2 h-4 w-4" /> Login with Google
                </Button>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
