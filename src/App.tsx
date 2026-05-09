import { QueryProvider } from '@/providers/QueryProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { ToastProvider } from '@/providers/ToastProvider';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';

function HelloUser() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-2xl font-semibold">Mojo Viability</h1>
          <p className="text-muted-foreground">Not signed in</p>
          <p className="text-xs text-muted-foreground">
            Sign in via the Supabase JS console for the bootstrap smoke test.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-semibold">Mojo Viability</h1>
        <p className="text-muted-foreground">Hello, {user.email}</p>
        <Button variant="outline" onClick={() => signOut()}>Sign out</Button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <HelloUser />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
