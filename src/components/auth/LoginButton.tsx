'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

// In a real application, this component would handle the Google OAuth flow.
// For demonstration purposes, it links to the dashboard.
export default function LoginButton() {
  const handleLogin = () => {
    // Placeholder for Google OAuth logic
    // e.g., signIn('google') with NextAuth.js
    console.log('Attempting Google Login...');
    // After successful login and Firestore operations, redirect to /dashboard.
  };

  return (
    <Link href="/dashboard" passHref>
      <Button size="lg" onClick={handleLogin} className="shadow-md hover:shadow-lg transition-shadow">
        <LogIn className="mr-2 h-5 w-5" /> Login with Google
      </Button>
    </Link>
  );
}
