import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadProjects } from '@/features/project/api/projectsApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/providers/AuthProvider';

interface ProjectSummary {
  id: string;
  name: string;
  updated_at: string;
}

export default function ProjectsListPage() {
  const { signOut, user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadProjects().then(({ projects, error }) => {
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      setProjects(
        (projects ?? []).map((p: { id: string; name: string; updated_at: string }) => ({
          id: p.id,
          name: p.name,
          updated_at: p.updated_at,
        })),
      );
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your projects</h1>
            <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
          </div>
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </header>

        {error && (
          <Card>
            <CardHeader>
              <CardTitle>Couldn't load projects</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        )}

        {projects && projects.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't created any viability projects. Get started from the landing page.
              </p>
              <Button asChild>
                <Link to="/start">Start your first project</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {projects && projects.length > 0 && (
          <div className="space-y-3">
            {projects.map((p) => (
              <Card key={p.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-medium">{p.name || 'Untitled project'}</p>
                    <p className="text-xs text-muted-foreground">
                      Last updated {new Date(p.updated_at).toLocaleString('en-AU')}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link to={`/project/${p.id}/break-even`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
