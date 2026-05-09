import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';

export default function InviteAcceptancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const token = searchParams.get('token');

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // Defer to /auth, preserving the intended destination via the search param.
      navigate(`/auth?from=invite&token=${token ?? ''}`, { replace: true });
    }
  }, [isLoading, user, token, navigate]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Missing invite token</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The invite link doesn't include a token. Please ask whoever invited you to resend the link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accepting invite…</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Hold tight while we link this project to your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
