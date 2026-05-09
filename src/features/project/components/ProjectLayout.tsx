import { createContext, useCallback, useContext, useState, useEffect } from 'react';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useProject, type ProjectRow } from '@/features/project/hooks/useProject';
import type { ProjectData } from '@/lib/types/projectTypes';
import { Button } from '@/components/ui/button';

const PROJECT_TAB_ROUTES: Record<string, string> = {
  simple: 'break-even',
  detailed: 'break-even/detailed',
  financing: 'financing',
  hours: 'hours',
  sales: 'sales',
  'menu-builder': 'menu-builder',
  labour: 'labour',
  location: 'location',
  predictions: 'predictions',
  plan: 'plan',
  'ai-business-plan': 'ai-plan',
  'plan-builder': 'plan-builder',
};

interface ProjectContextValue {
  projectId: string;
  projectName: string;
  projectData: ProjectData;
  patchProjectData: (patch: Partial<ProjectData>) => void;
  navigateTab: (tabKey: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProjectContext() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProjectContext must be used inside <ProjectLayout />');
  }
  return ctx;
}

export function ProjectLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const query = useProject(id);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  useEffect(() => {
    const nextData = query.data?.data;
    if (nextData) {
      setProjectData(nextData as ProjectData);
    }
  }, [query.data]);

  const patchProjectData = useCallback((patch: Partial<ProjectData>) => {
    setProjectData((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const navigateTab = useCallback(
    (tabKey: string) => {
      const slug = PROJECT_TAB_ROUTES[tabKey] ?? tabKey;
      navigate(`/project/${id}/${slug}`);
    },
    [id, navigate],
  );

  if (query.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading project…</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-semibold">Project not found</h1>
          <p className="text-sm text-muted-foreground">
            We couldn't find a project with that ID. It may have been deleted, or you may not have permission to view it.
          </p>
          <Button asChild>
            <Link to="/projects">Back to your projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  const row = query.data as ProjectRow;
  const project = projectData ?? (row.data as ProjectData);

  const value: ProjectContextValue = {
    projectId: row.id,
    projectName: row.name,
    projectData: project,
    patchProjectData,
    navigateTab,
  };

  return (
    <ProjectContext.Provider value={value}>
      <Outlet />
    </ProjectContext.Provider>
  );
}
