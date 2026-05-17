import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { AuthCard } from '@/components/viability/auth/AuthCard';
import { AuthField } from '@/components/viability/auth/AuthField';
import { VButton } from '@/components/viability/VButton';

type Mode = 'sign-in' | 'sign-up' | 'forgot-password';
type Status = 'idle' | 'submitting' | 'reset-sent';

const TITLES: Record<Mode, { title: string; description: string }> = {
  'sign-in': {
    title: 'Sign in',
    description: 'Welcome back to Mojo Viability.',
  },
  'sign-up': {
    title: 'Create your account',
    description: 'Free forever. No credit card.',
  },
  'forgot-password': {
    title: 'Reset your password',
    description: 'Enter your email and we’ll send you a link.',
  },
};

const SUBMIT_LABELS: Record<Mode, { idle: string; submitting: string }> = {
  'sign-in': { idle: 'Sign in →', submitting: 'Signing in…' },
  'sign-up': { idle: 'Create account →', submitting: 'Creating…' },
  'forgot-password': { idle: 'Send reset link →', submitting: 'Sending…' },
};

export default function AuthPage() {
  const { signIn, signUp, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [status, setStatus] = useState<Status>('idle');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setStatus('idle');
    setErrorMsg(null);
  }, [mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatus('submitting');
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        navigate('/projects');
      } else if (mode === 'sign-up') {
        await signUp(email, password);
        toast.success('Check your email to confirm your account.');
        setStatus('idle');
      } else {
        await requestPasswordReset(email);
        setStatus('reset-sent');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  };

  const resetToSignIn = () => {
    setMode('sign-in');
    setStatus('idle');
    setEmail('');
    setPassword('');
    setErrorMsg(null);
  };

  const footer = (() => {
    if (mode === 'sign-in') {
      return (
        <>
          <div>
            Don’t have an account?{' '}
            <button
              type="button"
              onClick={() => setMode('sign-up')}
              className="text-viability-green hover:text-viability-green-hover underline-offset-2 hover:underline"
            >
              Create one
            </button>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setMode('forgot-password')}
              className="text-viability-fg-muted hover:text-viability-cream underline-offset-2 hover:underline"
            >
              Forgot your password?
            </button>
          </div>
        </>
      );
    }
    if (mode === 'sign-up') {
      return (
        <div>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('sign-in')}
            className="text-viability-green hover:text-viability-green-hover underline-offset-2 hover:underline"
          >
            Sign in
          </button>
        </div>
      );
    }
    return (
      <div>
        <button
          type="button"
          onClick={resetToSignIn}
          className="text-viability-fg-muted hover:text-viability-cream underline-offset-2 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    );
  })();

  return (
    <AuthCard
      title={TITLES[mode].title}
      description={TITLES[mode].description}
      footer={status === 'reset-sent' ? undefined : footer}
    >
      {status === 'reset-sent' ? (
        <div className="space-y-4">
          <p className="font-sans text-[15px] text-viability-cream leading-relaxed">
            Reset link sent. Check your inbox — usually arrives in under a minute.
          </p>
          <p className="font-mono text-[11px] text-viability-fg-subtle">
            Going to {email}. If you don’t see it, check your spam folder.
          </p>
          <VButton variant="ghost" size="md" onClick={resetToSignIn}>
            Back to sign in
          </VButton>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <AuthField
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          {mode !== 'forgot-password' && (
            <AuthField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />
          )}
          {errorMsg && (
            <p className="font-mono text-[11px] text-viability-red">{errorMsg}</p>
          )}
          <VButton
            size="md"
            type="submit"
            disabled={status === 'submitting'}
            className="w-full justify-center"
          >
            {status === 'submitting'
              ? SUBMIT_LABELS[mode].submitting
              : SUBMIT_LABELS[mode].idle}
          </VButton>
        </form>
      )}
    </AuthCard>
  );
}
