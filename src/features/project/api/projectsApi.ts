import { supabase } from '@/lib/supabase';
import { ProjectData } from '@/lib/types/projectTypes';

export const saveProject = async (name: string, data: ProjectData) => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data: project, error } = await supabase
    .from('business_scenarios')
    .insert({
      user_id: user.id,
      name,
      data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  return { project, error };
};

export const updateProject = async (id: string, name: string, data: ProjectData) => {
  const { data: project, error } = await supabase
    .from('business_scenarios')
    .update({
      name,
      data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  return { project, error };
};

export const loadProjects = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data: projects, error } = await supabase
    .from('business_scenarios')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return { projects, error };
};

export const deleteProject = async (id: string) => {
  const { error } = await supabase
    .from('business_scenarios')
    .delete()
    .eq('id', id);

  return { error };
};

export const migrateProjectData = (oldData: any): ProjectData => {
  return oldData as ProjectData;
};
