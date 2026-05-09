import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-5xl font-semibold">404</h1>
        <p className="text-muted-foreground">
          We couldn't find the page you were looking for.
        </p>
        <Button asChild>
          <Link to="/">Back to landing</Link>
        </Button>
      </div>
    </div>
  );
}
