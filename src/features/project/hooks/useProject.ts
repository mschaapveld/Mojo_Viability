import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProjectData } from '@/lib/types/projectTypes';

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  data: ProjectData;
  created_at: string;
  updated_at: string;
}

async function fetchProject(id: string): Promise<ProjectRow | null> {
  const { data, error } = await supabase
    .from('business_scenarios')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return (data as ProjectRow | null) ?? null;
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id as string),
    enabled: !!id,
  });
}
