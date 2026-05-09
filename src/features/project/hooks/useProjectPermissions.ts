import { useQuery } from '@tanstack/react-query';
import { getProjectPermissions, type ProjectPermissions } from '@/features/project/api/permissionsApi';

export function useProjectPermissions(
  projectId: string | undefined,
  userId: string | undefined,
) {
  return useQuery<ProjectPermissions>({
    queryKey: ['projectPermissions', projectId, userId],
    queryFn: () => getProjectPermissions(projectId as string, userId as string),
    enabled: !!projectId && !!userId,
  });
}
