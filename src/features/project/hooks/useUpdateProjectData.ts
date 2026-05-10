import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '@/features/project/api/projectsApi';
import { applyCrossSectionSync } from '@/lib/calculations/crossSectionSync';
import type { ProjectRow } from '@/features/project/hooks/useProject';
import type { ProjectData } from '@/lib/types/projectTypes';

export interface UpdateProjectDataInput {
  id: string;
  name: string;
  updates: Partial<ProjectData>;
}

export function useUpdateProjectData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, updates }: UpdateProjectDataInput) => {
      const cached = queryClient.getQueryData<ProjectRow | null>(['project', id]);
      if (!cached) {
        throw new Error('Project not loaded');
      }
      const synced = applyCrossSectionSync(cached.data, updates);
      const { error } = await updateProject(id, name, synced);
      if (error) {
        throw error;
      }
      return synced;
    },
    onSuccess: (_synced, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}
