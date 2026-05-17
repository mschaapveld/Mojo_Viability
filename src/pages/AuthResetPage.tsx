import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { AuthCard } from '@/components/viability/auth/AuthCard';
import { AuthField } from '@/components/viability/auth/AuthField';
import { VButton } from '@/components/viability/VButton';

type Status = 'idle' | 'submitting' | 'success';

export default function AuthResetPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Passwords don’t match.');
      return;
    }
    setStatus('submitting');
    try {
      await updatePassword(password);
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('idle');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard
        title="Password updated"
        description="You can sign in with your new password now."
      >
        <VButton
          size="md"
          onClick={() => navigate('/auth')}
          className="w-full justify-center"
        >
          Sign in →
        </VButton>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Set a new password"
      description="Choose something you’ll remember. At least six characters."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <AuthField
          id="confirm"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          minLength={6}
          required
        />
        {errorMsg && (
          <p className="font-mono text-[11px] text-viability-red">{errorMsg}</p>
        )}
        <VButton
          size="md"
          type="submit"
          disabled={status === 'submitting'}
          className="w-full justify-center"
        >
          {status === 'submitting' ? 'Saving…' : 'Save new password →'}
        </VButton>
      </form>
    </AuthCard>
  );
}
