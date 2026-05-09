import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProject } from '@/features/project/api/projectsApi';
import type { ProjectData } from '@/lib/types/projectTypes';

export interface RenameProjectInput {
  id: string;
  name: string;
  data: ProjectData;
}

export function useRenameProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, data }: RenameProjectInput) => {
      const { project, error } = await updateProject(id, name, data);
      if (error) {
        throw error;
      }
      return project;
    },
    onSuccess: (_project, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}
