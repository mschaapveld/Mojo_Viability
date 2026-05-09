import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  createProjectInvite,
  getProjectCollaborators,
  getProjectInvites,
  removeCollaborator,
  updateCollaboratorRole,
  revokeInvite,
  type Collaborator,
  type ProjectInvite,
  type ProjectRole,
} from '@/features/project/api/permissionsApi';
import { Copy, Check, Trash2, Shield, Eye, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ShareProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  currentUserId: string;
}

export function ShareProjectDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  currentUserId,
}: ShareProjectDialogProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [inviteUrl, setInviteUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [collaboratorToRemove, setCollaboratorToRemove] = useState<Collaborator | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<ProjectInvite | null>(null);

  useEffect(() => {
    if (open) {
      loadCollaborators();
      loadInvites();
    } else {
      setInviteUrl('');
      setCopied(false);
    }
  }, [open, projectId]);

  const loadCollaborators = async () => {
    const collabs = await getProjectCollaborators(projectId);
    setCollaborators(collabs);
  };

  const loadInvites = async () => {
    const projectInvites = await getProjectInvites(projectId);
    setInvites(projectInvites);
  };

  const handleCreateInvite = async () => {
    setLoading(true);
    const result = await createProjectInvite(projectId, selectedRole, currentUserId);
    setLoading(false);

    if (result) {
      setInviteUrl(result.inviteUrl);
      loadInvites();
      toast({
        title: 'Invite link created',
        description: 'Copy the link below to share with others.',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create invite link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast({
        title: 'Link copied',
        description: 'Invite link copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!collaboratorToRemove) return;

    const success = await removeCollaborator(projectId, collaboratorToRemove.user_id);
    if (success) {
      toast({
        title: 'Collaborator removed',
        description: 'User no longer has access to this project.',
      });
      loadCollaborators();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to remove collaborator.',
        variant: 'destructive',
      });
    }
    setCollaboratorToRemove(null);
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    const success = await updateCollaboratorRole(projectId, userId, newRole);
    if (success) {
      toast({
        title: 'Role updated',
        description: 'Collaborator role has been updated.',
      });
      loadCollaborators();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to update role.',
        variant: 'destructive',
      });
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;

    const success = await revokeInvite(inviteToRevoke.id);
    if (success) {
      toast({
        title: 'Invite revoked',
        description: 'This invite link can no longer be used.',
      });
      loadInvites();
      if (inviteUrl.includes(inviteToRevoke.token)) {
        setInviteUrl('');
      }
    } else {
      toast({
        title: 'Error',
        description: 'Failed to revoke invite.',
        variant: 'destructive',
      });
    }
    setInviteToRevoke(null);
  };

  const getRoleIcon = (role: ProjectRole) => {
    switch (role) {
      case 'owner':
        return <Shield className="h-3 w-3" />;
      case 'editor':
        return <Edit className="h-3 w-3" />;
      case 'viewer':
        return <Eye className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: ProjectRole) => {
    switch (role) {
      case 'owner':
        return 'default';
      case 'editor':
        return 'secondary';
      case 'viewer':
        return 'outline';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Share Project</DialogTitle>
            <DialogDescription>
              Share "{projectName}" with others by creating an invite link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Create Invite Section */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Create Invite Link</Label>
                <p className="text-sm text-slate-600 mt-1">
                  Anyone with this link can access the project after signing in.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Permission Level</Label>
                  <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'editor' | 'viewer')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">Can view</SelectItem>
                      <SelectItem value="editor">Can edit</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    {selectedRole === 'viewer'
                      ? 'View-only access. Cannot edit or share the project.'
                      : 'Can view and edit the project. Cannot delete or share.'}
                  </p>
                </div>

                <Button onClick={handleCreateInvite} disabled={loading} className="w-full">
                  Create Invite Link
                </Button>

                {inviteUrl && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input value={inviteUrl} readOnly className="font-mono text-sm" />
                      <Button
                        onClick={handleCopyLink}
                        variant="outline"
                        size="icon"
                        className="shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Active Invites Section */}
            {invites.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Active Invite Links</Label>
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant={invite.role_granted === 'editor' ? 'secondary' : 'outline'}>
                          {invite.role_granted === 'editor' ? 'Can edit' : 'Can view'}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {invite.used_at ? 'Used' : 'Not used yet'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInviteToRevoke(invite)}
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Current Access Section */}
            {collaborators.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Current Access</Label>
                <div className="space-y-2">
                  {collaborators.map((collaborator) => {
                    const isCurrentUser = collaborator.user_id === currentUserId;
                    const isOwner = collaborator.role === 'owner';

                    return (
                      <div
                        key={collaborator.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRoleIcon(collaborator.role)}
                            <span className="text-sm font-medium">
                              {collaborator.user_email}
                              {isCurrentUser && ' (You)'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isOwner ? (
                            <Badge variant={getRoleBadgeVariant(collaborator.role)}>
                              Owner
                            </Badge>
                          ) : (
                            <>
                              <Select
                                value={collaborator.role}
                                onValueChange={(v) => handleUpdateRole(collaborator.user_id, v as ProjectRole)}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="editor">Can edit</SelectItem>
                                  <SelectItem value="viewer">Can view</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setCollaboratorToRemove(collaborator)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Collaborator Confirmation */}
      <Dialog open={!!collaboratorToRemove} onOpenChange={(open) => !open && setCollaboratorToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Collaborator</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {collaboratorToRemove?.user_email} from this project?
              They will no longer be able to access it.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setCollaboratorToRemove(null)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveCollaborator} className="bg-red-500 hover:bg-red-600">
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Invite Confirmation */}
      <Dialog open={!!inviteToRevoke} onOpenChange={(open) => !open && setInviteToRevoke(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Invite Link</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke this invite link? It will no longer be usable.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setInviteToRevoke(null)}>
              Cancel
            </Button>
            <Button onClick={handleRevokeInvite} className="bg-red-500 hover:bg-red-600">
              Revoke
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
