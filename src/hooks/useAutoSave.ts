import { useEffect, useRef, useState, useCallback } from 'react';
import { updateProject } from '@/features/project/api/projectsApi';
import { ProjectData } from '@/lib/types/projectTypes';

export type SaveStatus = 'saved' | 'saving' | 'error' | 'unsaved';

interface UseAutoSaveOptions {
  projectId: string | null;
  projectName: string;
  projectData: ProjectData;
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus;
  error: string | null;
  triggerSave: () => Promise<void>;
}

export function useAutoSave({
  projectId,
  projectName,
  projectData,
  debounceMs = 1200,
  enabled = true,
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('unsaved');
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>('');
  const isSavingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const performSave = useCallback(async () => {
    if (!projectId || !enabled) {
      setSaveStatus('unsaved');
      return;
    }

    if (isSavingRef.current) {
      return;
    }

    const currentDataString = JSON.stringify({ name: projectName, data: projectData });

    if (currentDataString === lastSavedDataRef.current) {
      return;
    }

    try {
      isSavingRef.current = true;
      setSaveStatus('saving');
      setError(null);

      const { error: saveError } = await updateProject(projectId, projectName, projectData);

      if (saveError) {
        throw saveError;
      }

      lastSavedDataRef.current = currentDataString;
      setSaveStatus('saved');
      retryCountRef.current = 0;
    } catch (err: any) {
      console.error('Auto-save error:', err);
      setError(err.message || 'Failed to save changes');
      setSaveStatus('error');

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          performSave();
        }, 2000 * retryCountRef.current);
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [projectId, projectName, projectData, enabled]);

  useEffect(() => {
    if (!projectId || !enabled) {
      setSaveStatus('unsaved');
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, debounceMs);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [projectId, projectName, projectData, debounceMs, enabled, performSave]);

  useEffect(() => {
    if (projectId) {
      lastSavedDataRef.current = JSON.stringify({ name: projectName, data: projectData });
    }
  }, [projectId]);

  const triggerSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await performSave();
  }, [performSave]);

  return {
    saveStatus,
    error,
    triggerSave,
  };
}
