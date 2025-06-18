import LoginForm from '../../components/auth/LoginForm';
import Link from 'next/link';
import { BackgroundEffects } from '../../components/ui/BackgroundEffects';

export default function LoginPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <BackgroundEffects />
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen">
        <LoginForm />
        <div className="mt-4 text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-primary hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
} 