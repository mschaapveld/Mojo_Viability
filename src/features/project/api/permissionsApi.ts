import { supabase } from '@/lib/supabase';

export type ProjectRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  user_email?: string;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  token: string;
  role_granted: 'editor' | 'viewer';
  created_by_user_id: string;
  created_at: string;
  revoked_at: string | null;
  used_at: string | null;
  used_by_user_id: string | null;
}

export interface ProjectPermissions {
  role: ProjectRole | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageCollaborators: boolean;
}

/**
 * Get user's role on a project
 */
export async function getUserProjectRole(
  projectId: string,
  userId: string
): Promise<ProjectRole | null> {
  const { data, error } = await supabase
    .from('collaborators')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data?.role || null;
}

/**
 * Get permissions for a user on a project
 */
export async function getProjectPermissions(
  projectId: string,
  userId: string
): Promise<ProjectPermissions> {
  const role = await getUserProjectRole(projectId, userId);

  return {
    role,
    canView: role !== null,
    canEdit: role === 'owner' || role === 'editor',
    canDelete: role === 'owner',
    canShare: role === 'owner',
    canManageCollaborators: role === 'owner',
  };
}

/**
 * Check if user can edit a project
 */
export async function canEditProject(
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProjectRole(projectId, userId);
  return role === 'owner' || role === 'editor';
}

/**
 * Check if user is project owner
 */
export async function isProjectOwner(
  projectId: string,
  userId: string
): Promise<boolean> {
  const role = await getUserProjectRole(projectId, userId);
  return role === 'owner';
}

/**
 * Get all collaborators for a project
 */
export async function getProjectCollaborators(
  projectId: string
): Promise<Collaborator[]> {
  const { data, error } = await supabase
    .from('collaborators')
    .select(`
      id,
      project_id,
      user_id,
      role,
      created_at
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }

  // Fetch user emails
  const collaboratorsWithEmails = await Promise.all(
    (data || []).map(async (collab) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', collab.user_id)
        .maybeSingle();

      return {
        ...collab,
        user_email: profile?.email || 'Unknown',
      };
    })
  );

  return collaboratorsWithEmails;
}

/**
 * Generate a secure random token for invite links
 */
function generateInviteToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a project invite link
 */
export async function createProjectInvite(
  projectId: string,
  roleGranted: 'editor' | 'viewer',
  createdByUserId: string
): Promise<{ invite: ProjectInvite; inviteUrl: string } | null> {
  const token = generateInviteToken();

  const { data, error } = await supabase
    .from('project_invites')
    .insert({
      project_id: projectId,
      token,
      role_granted: roleGranted,
      created_by_user_id: createdByUserId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invite:', error);
    return null;
  }

  const inviteUrl = `${window.location.origin}/invite/${token}`;

  return {
    invite: data,
    inviteUrl,
  };
}

/**
 * Get invite by token
 */
export async function getInviteByToken(
  token: string
): Promise<ProjectInvite | null> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('token', token)
    .is('revoked_at', null)
    .maybeSingle();

  if (error) {
    console.error('Error fetching invite:', error);
    return null;
  }

  return data;
}

/**
 * Accept a project invite
 */
export async function acceptProjectInvite(
  token: string,
  userId: string
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  // Get the invite
  const invite = await getInviteByToken(token);

  if (!invite) {
    return { success: false, error: 'Invalid or expired invite link' };
  }

  if (invite.used_at) {
    return { success: false, error: 'This invite link has already been used' };
  }

  // Check if user is already a collaborator
  const existingRole = await getUserProjectRole(invite.project_id, userId);
  if (existingRole) {
    return {
      success: true,
      projectId: invite.project_id,
      error: 'You already have access to this project',
    };
  }

  // Add user as collaborator
  const { error: collaboratorError } = await supabase
    .from('collaborators')
    .insert({
      project_id: invite.project_id,
      user_id: userId,
      role: invite.role_granted,
    });

  if (collaboratorError) {
    console.error('Error adding collaborator:', collaboratorError);
    return { success: false, error: 'Failed to add you as a collaborator' };
  }

  // Mark invite as used
  const { error: updateError } = await supabase
    .from('project_invites')
    .update({
      used_at: new Date().toISOString(),
      used_by_user_id: userId,
    })
    .eq('token', token);

  if (updateError) {
    console.error('Error updating invite:', updateError);
  }

  return { success: true, projectId: invite.project_id };
}

/**
 * Remove a collaborator from a project
 */
export async function removeCollaborator(
  projectId: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('collaborators')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing collaborator:', error);
    return false;
  }

  return true;
}

/**
 * Update collaborator role
 */
export async function updateCollaboratorRole(
  projectId: string,
  userId: string,
  newRole: ProjectRole
): Promise<boolean> {
  const { error } = await supabase
    .from('collaborators')
    .update({ role: newRole })
    .eq('project_id', projectId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating collaborator role:', error);
    return false;
  }

  return true;
}

/**
 * Get active invites for a project
 */
export async function getProjectInvites(
  projectId: string
): Promise<ProjectInvite[]> {
  const { data, error } = await supabase
    .from('project_invites')
    .select('*')
    .eq('project_id', projectId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    return [];
  }

  return data || [];
}

/**
 * Revoke an invite
 */
export async function revokeInvite(inviteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('project_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', inviteId);

  if (error) {
    console.error('Error revoking invite:', error);
    return false;
  }

  return true;
}
