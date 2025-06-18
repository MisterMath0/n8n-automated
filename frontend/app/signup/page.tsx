
import SignupForm from '../../components/auth/SignupForm';
import Link from 'next/link';
import { BackgroundEffects } from '../../components/ui/BackgroundEffects';

export default function SignupPage() {
  return (
    <div className="relative min-h-screen bg-black overflow-x-hidden">
      <BackgroundEffects />
      <div className="relative z-10 flex flex-col justify-center items-center min-h-screen">
        <SignupForm />
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
} 