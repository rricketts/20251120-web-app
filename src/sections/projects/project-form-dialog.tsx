import type { SelectChangeEvent } from '@mui/material/Select';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import OutlinedInput from '@mui/material/OutlinedInput';

import { supabase } from 'src/lib/supabase';

import { Iconify } from 'src/components/iconify';

type ProjectFormDialogProps = {
  open: boolean;
  project?: {
    id: string;
    name: string;
    plan: string;
    logo_url: string | null;
  } | null;
  onClose: () => void;
  onSave: (values: { name: string; plan: string; managerId: string }) => Promise<void>;
  currentUserRole?: string;
};

type Manager = {
  id: string;
  name: string;
  email: string;
};

type ProjectMember = {
  id: string;
  user_id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function ProjectFormDialog({ open, project, onClose, onSave, currentUserRole }: ProjectFormDialogProps) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Free');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Manager[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    const fetchManagers = async () => {
      if (isAdmin && open && !project) {
        try {
          const { data, error: fetchError } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('role', 'manager')
            .order('name', { ascending: true });

          if (fetchError) throw fetchError;
          setManagers(data || []);
        } catch (err) {
          console.error('Error fetching managers:', err);
        }
      }
    };

    const fetchProjectMembers = async () => {
      if (project && open) {
        setLoadingMembers(true);
        try {
          const { data: membersData, error: membersError } = await supabase
            .from('project_members')
            .select(`
              id,
              user_id,
              role,
              user:users(id, name, email)
            `)
            .eq('project_id', project.id);

          if (membersError) throw membersError;
          setProjectMembers(membersData as any || []);

          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, name, email')
            .order('name', { ascending: true });

          if (usersError) throw usersError;
          setAvailableUsers(usersData || []);
        } catch (err) {
          console.error('Error fetching project members:', err);
        } finally {
          setLoadingMembers(false);
        }
      }
    };

    if (project) {
      setName(project.name);
      setPlan(project.plan);
      setManagerId('');
      fetchProjectMembers();
    } else {
      setName('');
      setPlan('Free');
      setManagerId('');
      setProjectMembers([]);
      setAvailableUsers([]);
      setSelectedUsers([]);
    }
    setError('');
    fetchManagers();
  }, [project, open, isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Domain name is required');
      return;
    }

    if (isAdmin && !project && !managerId) {
      setError('Please select a manager');
      return;
    }

    try {
      setSaving(true);
      await onSave({ name: name.trim(), plan, managerId });
    } catch (err) {
      setError('Failed to save project. Please try again.');
      console.error('Error saving project:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePlanChange = (event: SelectChangeEvent) => {
    setPlan(event.target.value);
  };

  const handleAddUsers = async () => {
    if (!project || selectedUsers.length === 0) return;

    try {
      setSaving(true);
      const newMembers = selectedUsers.map(userId => ({
        project_id: project.id,
        user_id: userId,
        role: 'member',
      }));

      const { error: insertError } = await supabase
        .from('project_members')
        .insert(newMembers);

      if (insertError) throw insertError;

      const { data: updatedMembers, error: fetchError } = await supabase
        .from('project_members')
        .select(`
          id,
          user_id,
          role,
          user:users(id, name, email)
        `)
        .eq('project_id', project.id);

      if (fetchError) throw fetchError;
      setProjectMembers(updatedMembers as any || []);
      setSelectedUsers([]);
    } catch (err) {
      console.error('Error adding users:', err);
      setError('Failed to add users. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return;

    try {
      setSaving(true);
      const { error: deleteError } = await supabase
        .from('project_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      setProjectMembers(prev => prev.filter(m => m.id !== memberId));
    } catch (err) {
      console.error('Error removing member:', err);
      setError('Failed to remove member. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!project) return;

    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (updateError) throw updateError;

      setProjectMembers(prev =>
        prev.map(m => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const existingUserIds = projectMembers.map(m => m.user_id);
  const availableUsersForSelection = availableUsers.filter(
    u => !existingUserIds.includes(u.id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{project ? 'Edit project' : 'Create new project'}</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Domain name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!error && !name.trim()}
              helperText={error && !name.trim() ? error : ''}
              disabled={saving}
              placeholder="example.com"
            />

            <FormControl fullWidth disabled={saving}>
              <InputLabel>Plan</InputLabel>
              <Select value={plan} label="Plan" onChange={handlePlanChange}>
                <MenuItem value="Free">Free</MenuItem>
                <MenuItem value="Pro">Pro</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>

            {isAdmin && !project && (
              <FormControl fullWidth disabled={saving}>
                <InputLabel>Assign to Manager</InputLabel>
                <Select
                  value={managerId}
                  label="Assign to Manager"
                  onChange={(e) => setManagerId(e.target.value)}
                >
                  {managers.map((manager) => (
                    <MenuItem key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {project && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Project Members
                </Typography>

                {loadingMembers ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading members...
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {projectMembers.map((member) => (
                      <Box
                        key={member.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          p: 1.5,
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {member.user.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {member.user.email}
                          </Typography>
                        </Box>
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={member.role}
                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                            disabled={saving || member.role === 'owner'}
                          >
                            <MenuItem value="owner">Owner</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="member">Member</MenuItem>
                          </Select>
                        </FormControl>
                        {member.role !== 'owner' && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={saving}
                            startIcon={<Iconify icon="eva:close-fill" />}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    ))}

                    {availableUsersForSelection.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Add Members
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Select users</InputLabel>
                          <Select
                            multiple
                            value={selectedUsers}
                            onChange={(e) => setSelectedUsers(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            input={<OutlinedInput label="Select users" />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => {
                                  const user = availableUsers.find(u => u.id === value);
                                  return <Chip key={value} label={user?.name} size="small" />;
                                })}
                              </Box>
                            )}
                            disabled={saving}
                          >
                            {availableUsersForSelection.map((user) => (
                              <MenuItem key={user.id} value={user.id}>
                                {user.name} ({user.email})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          variant="outlined"
                          onClick={handleAddUsers}
                          disabled={saving || selectedUsers.length === 0}
                          startIcon={<Iconify icon="eva:person-add-fill" />}
                        >
                          Add Selected Users
                        </Button>
                      </>
                    )}
                  </Box>
                )}
              </>
            )}

            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : project ? 'Save changes' : 'Create project'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
