import { useMutation, useQueryClient } from '@tanstack/react-query';
import { saveProject } from '@/features/project/api/projectsApi';
import type { ProjectData } from '@/lib/types/projectTypes';

export interface SaveProjectInput {
  name: string;
  data: ProjectData;
}

export function useSaveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, data }: SaveProjectInput) => {
      const { project, error } = await saveProject(name, data);
      if (error) {
        throw error;
      }
      return project;
    },
    onSuccess: (project) => {
      if (project?.id) {
        queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      }
    },
  });
}
