import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

type Mode = 'sign-in' | 'sign-up';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'sign-in') {
        await signIn(email, password);
        navigate('/projects');
      } else {
        await signUp(email, password);
        toast.success('Check your email to confirm your account.');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{mode === 'sign-in' ? 'Sign in' : 'Create your account'}</CardTitle>
          <CardDescription>
            {mode === 'sign-in'
              ? 'Welcome back to Mojo Viability.'
              : 'Build your business viability assessment.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Sign up'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            {mode === 'sign-in' ? (
              <>
                Don't have an account?{' '}
                <button onClick={() => setMode('sign-up')} className="underline">
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button onClick={() => setMode('sign-in')} className="underline">
                  Sign in
                </button>
              </>
            )}
          </div>
          <div className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="underline">Back to landing</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
