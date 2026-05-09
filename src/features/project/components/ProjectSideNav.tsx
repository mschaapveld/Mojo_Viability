import { Calculator, ChartBar, DollarSign, Clock, Grid3x3, MapPin, Brain, FilePlus, Save, FolderOpen, Download, ListChecks, Users, TrendingUp, Share2, ChefHat } from 'lucide-react';
import { BusinessOrigin } from '@/lib/types/projectTypes';

interface ProjectSideNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  onShowAuth: () => void;
  onNewProject: (origin: BusinessOrigin) => void;
  onSaveProject: (() => void) | undefined;
  onLoadProject: (() => void) | undefined;
  onExport: (() => void) | undefined;
  onShare: (() => void) | null;
  shareDisabledReason: string | null;
  onShowNewProjectDialog: () => void;
  onReturnToHub: () => void;
}

export default function ProjectSideNav({
  activeTab, onTabChange, user, onShowAuth,
  onShowNewProjectDialog, onSaveProject, onLoadProject,
  onExport, onShare, shareDisabledReason,
}: ProjectSideNavProps) {

  const sidebarBg        = 'hsl(var(--sidebar))';
  const sidebarBorder    = 'hsl(var(--sidebar-border))';
  const labelColor       = 'hsl(var(--muted-foreground) / 0.7)';
  const actionColor      = 'hsl(var(--muted-foreground))';
  const actionHoverBg    = 'hsl(var(--foreground) / 0.05)';
  const actionHoverColor = 'hsl(var(--foreground))';
  const navDefaultColor  = 'hsl(var(--muted-foreground) / 0.8)';
  const navLockedColor   = 'hsl(var(--muted-foreground) / 0.35)';
  const navHoverBg       = 'hsl(var(--foreground) / 0.04)';
  const dividerColor     = 'hsl(var(--border))';

  const navItems = [
    { id: 'simple', label: 'Simple Break-Even', icon: Calculator, requiresAuth: false },
    { id: 'plan-builder', label: 'Project Setup', icon: ListChecks, requiresAuth: true },
    { id: 'financing', label: 'Fitout & Financing', icon: DollarSign, requiresAuth: true },
    { id: 'detailed', label: 'Detailed Break-Even', icon: ChartBar, requiresAuth: true },
    { id: 'hours', label: 'Hours of Operation', icon: Clock, requiresAuth: true },
    { id: 'labour', label: 'Labour Costing', icon: Users, requiresAuth: true },
    { id: 'sales', label: 'Sales Breakup', icon: Grid3x3, requiresAuth: true },
    { id: 'menu-builder', label: 'Menu Builder', icon: ChefHat, requiresAuth: true },
    { id: 'location', label: 'Location Suitability', icon: MapPin, requiresAuth: true },
    { id: 'predictions', label: 'Sales Predictions', icon: TrendingUp, requiresAuth: true },
    { id: 'ai-business-plan', label: 'AI Business Plan', icon: Brain, requiresAuth: true },
  ];

  const handleNavClick = (item: typeof navItems[0]) => {
    if (item.requiresAuth && !user) {
      onShowAuth();
    } else {
      onTabChange(item.id);
    }
  };

  const onActionEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = actionHoverBg;
    e.currentTarget.style.color = actionHoverColor;
  };
  const onActionLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'transparent';
    e.currentTarget.style.color = actionColor;
  };

  const actionStyle: React.CSSProperties = {
    width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 1.5rem', background: 'transparent', border: 'none',
    color: actionColor, fontSize: '0.85rem',
    fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', textAlign: 'left',
    transition: 'all 0.15s',
  };

  return (
    <aside style={{
      width: '16rem', minWidth: '16rem', flexShrink: 0,
      background: sidebarBg,
      borderRight: `1px solid ${sidebarBorder}`,
      position: 'fixed', top: 48, left: 0,
      height: 'calc(100vh - 48px)',
      display: 'flex', flexDirection: 'column', zIndex: 40, overflow: 'hidden',
    }}>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: '0.75rem', paddingBottom: '1.25rem', overflowY: 'auto', overflowX: 'hidden' }}>

        <div style={{
          padding: '0 1.5rem 0.25rem',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: labelColor,
          fontFamily: 'DM Sans, sans-serif',
          textTransform: 'uppercase',
          marginBottom: '0.25rem',
        }}>
          {user ? 'Project' : 'Actions'}
        </div>

        {user && (
          <>
            <button style={actionStyle} onMouseEnter={onActionEnter} onMouseLeave={onActionLeave} onClick={onShowNewProjectDialog}>
              <FilePlus size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> New
            </button>
            <button style={actionStyle} onMouseEnter={onActionEnter} onMouseLeave={onActionLeave} onClick={onSaveProject}>
              <Save size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> Save
            </button>
            <button style={actionStyle} onMouseEnter={onActionEnter} onMouseLeave={onActionLeave} onClick={onLoadProject}>
              <FolderOpen size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> Load
            </button>
          </>
        )}

        <button style={actionStyle} onMouseEnter={onActionEnter} onMouseLeave={onActionLeave} onClick={onExport}>
          <Download size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> Export
        </button>

        <div style={{ position: 'relative' }} className="group">
          <button
            style={{ ...actionStyle, color: onShare ? actionColor : navLockedColor, cursor: onShare ? 'pointer' : 'not-allowed' }}
            onMouseEnter={e => onShare && onActionEnter(e)}
            onMouseLeave={e => onShare && onActionLeave(e)}
            onClick={onShare || undefined}>
            <Share2 size={14} style={{ flexShrink: 0, opacity: 0.6 }} /> Share
          </button>
          {shareDisabledReason && !onShare && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ position: 'absolute', left: '100%', marginLeft: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', fontSize: '0.72rem', borderRadius: '6px', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 999, border: '1px solid hsl(var(--border))' }}>
              {shareDisabledReason}
            </div>
          )}
        </div>

        <div style={{ margin: '0.75rem 0 0.25rem', borderTop: `1px solid ${dividerColor}` }} />

        <div style={{
          padding: '0.5rem 1.5rem 0.25rem',
          fontSize: '0.68rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: labelColor,
          fontFamily: 'DM Sans, sans-serif',
          textTransform: 'uppercase',
        }}>
          Navigation
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isLocked = item.requiresAuth && !user;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '0.6rem',
                padding: '0.6rem 1.5rem',
                border: 'none',
                borderLeft: isActive ? '2px solid hsl(var(--brand))' : '2px solid transparent',
                background: isActive ? 'hsl(var(--brand) / 0.08)' : 'transparent',
                color: isActive ? 'hsl(var(--foreground))' : isLocked ? navLockedColor : navDefaultColor,
                fontSize: '0.85rem', fontFamily: 'DM Sans, sans-serif',
                fontWeight: isActive ? 600 : 400, cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = navHoverBg; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
            >
              <Icon size={14} style={{ flexShrink: 0, opacity: isActive ? 1 : isLocked ? 0.3 : 0.7 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              {isLocked && (
                <svg style={{ width: '0.75rem', height: '0.75rem', opacity: 0.25, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              )}
            </button>
          );
        })}

      </nav>

    </aside>
  );
}
