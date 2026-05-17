import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadProjects } from '@/features/project/api/projectsApi';
import { ViabilityHeader } from '@/components/viability/ViabilityHeader';
import { ViabilityFooter } from '@/components/viability/ViabilityFooter';
import { VButton } from '@/components/viability/VButton';
import { useAuth } from '@/providers/AuthProvider';

interface ProjectSummary {
  id: string;
  name: string;
  updated_at: string;
}

function formatUpdatedAt(value: string): string {
  return new Date(value).toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ProjectsListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
    <div className="bg-viability-ink text-viability-cream min-h-screen flex flex-col font-sans">
      <ViabilityHeader />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-16">
        <header>
          <h1 className="font-display font-semibold text-[clamp(38px,4.2vw,60px)] leading-[1.02] tracking-[-0.025em] text-viability-cream">
            Your projects
          </h1>
          {user?.email && (
            <p className="font-sans text-viability-fg-muted text-[14px] mt-3">
              Signed in as {user.email}
            </p>
          )}
        </header>

        <div className="mt-12 space-y-3">
          {error && (
            <div className="bg-viability-ink-2 border border-viability-border rounded-tight p-8">
              <h2 className="font-display text-[24px] text-viability-cream">
                Couldn't load projects
              </h2>
              <p className="font-mono text-[13px] text-viability-red mt-3">{error}</p>
            </div>
          )}

          {!error && projects === null && (
            <p className="font-mono text-[12px] text-viability-fg-muted">Loading…</p>
          )}

          {!error && projects && projects.length === 0 && (
            <div className="bg-viability-ink-2 border border-viability-border rounded-tight p-8">
              <h2 className="font-display text-[28px] text-viability-cream">No projects yet</h2>
              <p className="font-sans text-[15px] text-viability-fg-muted mt-3 mb-6">
                You haven't created any viability projects. Get started from the landing page.
              </p>
              <VButton size="md" onClick={() => navigate('/start')}>
                Start your first project →
              </VButton>
            </div>
          )}

          {!error && projects && projects.length > 0 && (
            <div className="space-y-3">
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => navigate(`/project/${p.id}/break-even`)}
                  className="bg-viability-ink-2 border border-viability-border rounded-tight p-6 w-full flex justify-between items-center text-left hover:bg-viability-ink-3 transition-colors"
                >
                  <div>
                    <p className="font-display text-[22px] text-viability-cream">
                      {p.name || 'Untitled project'}
                    </p>
                    <p className="font-mono text-[11px] text-viability-fg-subtle mt-1.5">
                      Last updated {formatUpdatedAt(p.updated_at)}
                    </p>
                  </div>
                  <VButton size="sm" variant="ghost">
                    Open →
                  </VButton>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <ViabilityFooter />
    </div>
  );
}
