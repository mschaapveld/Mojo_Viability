import { useState } from 'react';
import { Save, X } from 'lucide-react';
import { SaveProjectValidationDialog } from '@/features/project/components/SaveProjectValidationDialog';
import { ProjectData } from '@/lib/types/projectTypes';
import { useTheme } from '@/providers/ThemeProvider';

interface SaveProjectCTAProps {
  projectId: string | null;
  projectName: string;
  projectData: ProjectData;
  onSave: () => Promise<void>;
  onNavigateToSetup?: () => void;
}

export function SaveProjectCTA({
  projectId,
  projectName,
  projectData,
  onSave,
  onNavigateToSetup,
}: SaveProjectCTAProps) {
  const { theme } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (projectId || isDismissed) {
    return null;
  }

  const validateProject = (): { isValid: boolean; missingFields: string[] } => {
    const missingFields: string[] = [];

    if (!projectName || projectName.trim() === '' || projectName === 'New Business Opportunity') {
      missingFields.push('Business name');
    }

    if (!projectData.location?.address || projectData.location.address.trim() === '') {
      missingFields.push('Business address');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  };

  const handleSave = async () => {
    const validation = validateProject();

    if (!validation.isValid) {
      setShowValidationDialog(true);
      return;
    }

    try {
      setIsSaving(true);
      await onSave();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoToSetup = () => {
    setShowValidationDialog(false);
    if (onNavigateToSetup) {
      onNavigateToSetup();
    }
  };

  const validation = validateProject();

  return (
    <>
      <div style={{ position: 'fixed', bottom: 0, left: '16rem', right: 0, zIndex: 45, background: theme === 'dark' ? '#0f0f0f' : '#ffffff', borderTop: theme === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', boxShadow: theme === 'dark' ? '0 -4px 24px rgba(0,0,0,0.4)' : '0 -4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.95rem', color: theme === 'dark' ? '#f5f2ed' : '#0f172a' }}>Save Your Project</h3>
            <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', color: theme === 'dark' ? 'rgba(245,242,237,0.45)' : '#64748b', marginTop: '0.15rem' }}>
              Save your project to enable auto-save, sharing, and exports
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setIsDismissed(true)}
              className="text-sm"
              style={{ color: theme === 'dark' ? 'rgba(245,242,237,0.5)' : '#64748b', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}
            >
              <X className="h-4 w-4 mr-2" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
              Continue without saving
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="gap-2"
              style={{ background: '#e8622a', color: 'white', border: 'none', borderRadius: '8px', padding: '0.5rem 1.25rem', fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: '0.82rem', cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: isSaving ? 0.7 : 1 }}
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </div>
      </div>

      <SaveProjectValidationDialog
        open={showValidationDialog}
        onClose={() => setShowValidationDialog(false)}
        onGoToSetup={handleGoToSetup}
        missingFields={validation.missingFields}
      />
    </>
  );
}
