import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Pencil, HelpCircle, LogOut } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/providers/AuthProvider';
import { useProject, type ProjectRow } from '@/features/project/hooks/useProject';
import { useProjectAutoSave } from '@/features/project/hooks/useProjectAutoSave';
import { useProjectPermissions } from '@/features/project/hooks/useProjectPermissions';
import { useRenameProject } from '@/features/project/hooks/useRenameProject';
import { useSaveProject } from '@/features/project/hooks/useSaveProject';
import { applyCrossSectionSync } from '@/lib/calculations/crossSectionSync';
import { scaleProjectByPeriod } from '@/lib/scaleProjectByPeriod';
import ProjectSideNav from '@/features/project/components/ProjectSideNav';
import { BusinessSnapshot } from '@/features/project/components/BusinessSnapshot';
import { SaveStatusIndicator } from '@/features/project/components/SaveStatusIndicator';
import { SaveProjectCTA } from '@/features/project/components/SaveProjectCTA';
import { HelpDialog } from '@/features/project/components/HelpDialog';
import { NewProjectOriginDialog } from '@/features/project/components/NewProjectOriginDialog';
import { ShareProjectDialog } from '@/features/project/components/ShareProjectDialog';
import { buildExportData } from '@/lib/export/exportDataBuilder';
import { exportComprehensivePDF } from '@/lib/export/exportToPDF';
import { exportComprehensiveExcel } from '@/lib/export/exportToExcel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BusinessOrigin, Period, ProjectData } from '@/lib/types/projectTypes';

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

const URL_SLUG_TO_TAB: Record<string, string> = Object.entries(PROJECT_TAB_ROUTES).reduce(
  (acc, [tabKey, slug]) => {
    acc[slug] = tabKey;
    return acc;
  },
  {} as Record<string, string>,
);

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
  const location = useLocation();
  const { user, signOut } = useAuth();

  const query = useProject(id);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);

  useEffect(() => {
    const nextData = query.data?.data;
    if (nextData) {
      setProjectData(nextData as ProjectData);
    }
  }, [query.data]);

  const patchProjectData = useCallback((patch: Partial<ProjectData>) => {
    setProjectData((prev) => (prev ? applyCrossSectionSync(prev, patch) : prev));
  }, []);

  const navigateTab = useCallback(
    (tabKey: string) => {
      const slug = PROJECT_TAB_ROUTES[tabKey] ?? tabKey;
      navigate(`/project/${id}/${slug}`);
    },
    [id, navigate],
  );

  const activeTab = useMemo(() => {
    const prefix = `/project/${id}/`;
    if (!location.pathname.startsWith(prefix)) return 'simple';
    const slug = location.pathname.slice(prefix.length);
    return URL_SLUG_TO_TAB[slug] ?? URL_SLUG_TO_TAB[slug.split('/')[0]] ?? 'simple';
  }, [location.pathname, id]);

  // Chrome dialog state
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showNewProjectOriginDialog, setShowNewProjectOriginDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [renameInputName, setRenameInputName] = useState('');
  const [renameInputTown, setRenameInputTown] = useState('');

  const permissions = useProjectPermissions(id, user?.id);
  const renameMutation = useRenameProject();
  const saveProjectMutation = useSaveProject();

  // Manual save trigger lives on autosave hook; safe to call no-op when row missing.
  const projectName = query.data?.name ?? '';
  const autoSave = useProjectAutoSave({
    projectId: id ?? null,
    projectName,
    projectData: projectData ?? ({} as ProjectData),
    enabled: !!id && !!projectData,
  });

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

  const canShare = permissions.data?.canShare ?? false;

  const openRenameDialog = () => {
    setRenameInputName(row.name);
    setRenameInputTown(project.storeTown ?? '');
    setShowRenameDialog(true);
  };

  const handleRenameSubmit = async () => {
    const nextData: ProjectData = { ...project, storeTown: renameInputTown };
    try {
      await renameMutation.mutateAsync({ id: row.id, name: renameInputName, data: nextData });
      setShowRenameDialog(false);
      toast.success('Project updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update project');
    }
  };

  const handleManualSave = async () => {
    try {
      if (id) {
        await autoSave.triggerSave();
        toast.success('Project saved');
        return;
      }
      await saveProjectMutation.mutateAsync({ name: projectName, data: project });
      toast.success('Project saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save project');
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === project.period) return;
    setProjectData((prev) => (prev ? scaleProjectByPeriod(prev, newPeriod) : prev));
    toast.success(`Period changed to ${newPeriod}`);
  };

  const handleNewProjectConfirm = (_origin: BusinessOrigin) => {
    setShowNewProjectOriginDialog(false);
    // Step 10: wire to useCreateProject(origin) mutation; navigate to /project/:newId/break-even.
    toast.info('New project creation lands in Step 10.');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not sign out');
    }
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    try {
      const data = buildExportData(project);
      const exportName = projectName || 'Project';
      if (format === 'pdf') {
        await exportComprehensivePDF(data, exportName);
      } else {
        await exportComprehensiveExcel(data, exportName);
      }
      setShowExportDialog(false);
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    }
  };

  return (
    <ProjectContext.Provider value={value}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top header */}
        <header
          className="flex items-center justify-between border-b bg-card"
          style={{ height: 48, paddingLeft: '1rem', paddingRight: '1rem', flexShrink: 0 }}
        >
          <Link to="/projects" className="text-sm font-semibold tracking-tight">
            Mojo Viability
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowHelpDialog(true)}>
              <HelpCircle className="h-4 w-4 mr-1" /> Help
            </Button>
            {user && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-1" /> Sign out
              </Button>
            )}
          </div>
        </header>

        {/* Sidebar (fixed left, top: 48) */}
        <ProjectSideNav
          activeTab={activeTab}
          onTabChange={navigateTab}
          user={user}
          onShowAuth={() => navigate('/auth')}
          onNewProject={handleNewProjectConfirm}
          onSaveProject={handleManualSave}
          onLoadProject={() => navigate('/projects')}
          onExport={() => setShowExportDialog(true)}
          onShare={canShare ? () => setShowShareDialog(true) : null}
          shareDisabledReason={canShare ? null : 'Only the project owner can share this project'}
          onShowNewProjectDialog={() => setShowNewProjectOriginDialog(true)}
          onReturnToHub={() => {
            // No hub in viability standalone (Q3 strip — kept as no-op for prop compatibility).
          }}
        />

        {/* Main content (offset by sidebar width) */}
        <main className="flex-1" style={{ marginLeft: '16rem', paddingBottom: '5rem' }}>
          {/* Sub-header: project name + locality + period + save status */}
          <div className="border-b bg-card/50 px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold truncate">{row.name}</h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={openRenameDialog}
                    aria-label="Edit project name"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {project.storeTown && (
                  <p className="text-xs text-muted-foreground truncate">{project.storeTown}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Select
                value={project.period}
                onValueChange={(value) => handlePeriodChange(value as Period)}
              >
                <SelectTrigger className="w-32" aria-label="Period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <SaveStatusIndicator
                status={autoSave.saveStatus}
                error={autoSave.error}
                onRetry={() => void autoSave.triggerSave()}
              />
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            <BusinessSnapshot
              projectData={project}
              onNavigateToDetailed={() => navigateTab('detailed')}
            />
            <Outlet />
          </div>
        </main>

        <SaveProjectCTA
          projectId={row.id}
          projectName={row.name}
          projectData={project}
          onSave={handleManualSave}
          onNavigateToSetup={() => navigateTab('plan-builder')}
        />
      </div>

      {/* Dialogs mounted at root */}
      <HelpDialog open={showHelpDialog} onOpenChange={setShowHelpDialog} />

      <NewProjectOriginDialog
        open={showNewProjectOriginDialog}
        onClose={() => setShowNewProjectOriginDialog(false)}
        onConfirm={handleNewProjectConfirm}
      />

      <ShareProjectDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        projectId={row.id}
        projectName={row.name}
        currentUserId={user?.id ?? ''}
      />

      {/* Inline rename dialog (lightweight; full edit-settings dialog deferred to Phase 2.5) */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>Update the project name and town.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-name">Project name</Label>
              <Input
                id="rename-name"
                value={renameInputName}
                onChange={(e) => setRenameInputName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rename-town">Town or suburb</Label>
              <Input
                id="rename-town"
                value={renameInputTown}
                onChange={(e) => setRenameInputTown(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              disabled={renameMutation.isPending || !renameInputName.trim()}
            >
              {renameMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline export dialog (minimal; full export-mode dialog with simple/full split deferred to Phase 2.5) */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export project</DialogTitle>
            <DialogDescription>Choose a format to download.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <Button onClick={() => handleExport('pdf')}>PDF</Button>
            <Button onClick={() => handleExport('excel')}>Excel</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProjectContext.Provider>
  );
}
