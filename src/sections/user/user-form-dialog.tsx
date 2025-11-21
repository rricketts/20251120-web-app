import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControlLabel from '@mui/material/FormControlLabel';

import { supabase } from 'src/lib/supabase';

import type { UserProps } from './user-table-row';

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: UserProps | null;
  currentUserRole?: string;
};

type Project = {
  id: string;
  name: string;
};

const ALL_ROLES = ['admin', 'manager', 'user'];

const getRolesForUser = (userRole: string) => {
  if (userRole === 'admin') {
    return ALL_ROLES;
  }
  if (userRole === 'manager') {
    return ['manager', 'user'];
  }
  return [];
};

export function UserFormDialog({ open, onClose, onSuccess, editUser, currentUserRole = 'user' }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'user',
    isVerified: false,
    status: 'active',
  });

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableRoles = getRolesForUser(currentUserRole);
  const isManagerRole = currentUserRole === 'manager';

  useEffect(() => {
    if (!open) return;

    const fetchProjects = async () => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .order('name', { ascending: true });

        if (projectsError) throw projectsError;
        setAvailableProjects(projectsData || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };

    const fetchUserProjects = async () => {
      if (editUser) {
        try {
          const { data: memberData, error: memberError } = await supabase
            .from('project_members')
            .select('project_id')
            .eq('user_id', editUser.id);

          if (memberError) throw memberError;
          setSelectedProjects((memberData || []).map(m => m.project_id));
        } catch (err) {
          console.error('Error fetching user projects:', err);
        }
      } else {
        setSelectedProjects([]);
      }
    };

    if (isManagerRole) {
      fetchProjects();
    }
    fetchUserProjects();

    const roles = getRolesForUser(currentUserRole);
    const defaultRole = roles.length > 0 ? roles[roles.length - 1] : 'user';

    if (editUser) {
      setFormData({
        name: editUser.name,
        email: editUser.email,
        password: '',
        passwordConfirm: '',
        role: editUser.role,
        isVerified: editUser.isVerified,
        status: editUser.status,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        role: defaultRole,
        isVerified: false,
        status: 'active',
      });
    }
  }, [editUser, open, currentUserRole, isManagerRole]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      isVerified: event.target.checked,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    if (!editUser) {
      if (!formData.password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      if (formData.password !== formData.passwordConfirm) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
    }

    try {
      let userId: string;

      if (editUser) {
        userId = editUser.id;
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name: formData.name,
            role: formData.role,
            is_verified: formData.isVerified,
            status: formData.status,
          })
          .eq('id', editUser.id);

        if (updateError) throw updateError;

        if (formData.isVerified !== editUser.isVerified) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            try {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-user-email`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: editUser.id,
                    verify: formData.isVerified,
                  }),
                }
              );

              if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to update email verification:', errorData);
              }
            } catch (err) {
              console.error('Failed to call verify-user-email function:', err);
            }
          }
        }

        if (isManagerRole) {
          const { error: deleteError } = await supabase
            .from('project_members')
            .delete()
            .eq('user_id', userId);

          if (deleteError) throw deleteError;

          if (selectedProjects.length > 0) {
            const memberships = selectedProjects.map(projectId => ({
              project_id: projectId,
              user_id: userId,
              role: 'member',
            }));

            const { error: insertError } = await supabase
              .from('project_members')
              .insert(memberships);

            if (insertError) throw insertError;
          }
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-user-email`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              role: formData.role,
              isVerified: formData.isVerified,
              createUser: true,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create user');
        }

        const responseData = await response.json();
        userId = responseData.userId;

        const { data: { user: currentUser } } = await supabase.auth.getUser();

        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userId,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              is_verified: formData.isVerified,
              status: formData.status,
              created_by: currentUser?.id,
            },
          ]);

        if (insertError) throw insertError;

        if (isManagerRole && selectedProjects.length > 0) {
          const memberships = selectedProjects.map(projectId => ({
            project_id: projectId,
            user_id: userId,
            role: 'member',
          }));

          const { error: memberError } = await supabase
            .from('project_members')
            .insert(memberships);

          if (memberError) throw memberError;
        }
      }

      setFormData({
        name: '',
        email: '',
        password: '',
        passwordConfirm: '',
        role: availableRoles.length > 0 ? availableRoles[availableRoles.length - 1] : 'user',
        isVerified: false,
        status: 'active',
      });
      setSelectedProjects([]);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(`Error ${editUser ? 'updating' : 'creating'} user:`, err);
      setError(err.message || `Failed to ${editUser ? 'update' : 'create'} user`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editUser ? 'Edit User' : 'Add New User'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              required
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={handleChange('role')}
              disabled={loading}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              fullWidth
              label="Name"
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
            />

            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading || !!editUser}
              helperText={editUser ? 'Email cannot be changed' : ''}
            />

            {!editUser && (
              <>

                <TextField
                  required
                  fullWidth
                  type="password"
                  label="Password"
                  value={formData.password}
                  onChange={handleChange('password')}
                  disabled={loading}
                  helperText="Minimum 6 characters"
                />

                <TextField
                  required
                  fullWidth
                  type="password"
                  label="Confirm Password"
                  value={formData.passwordConfirm}
                  onChange={handleChange('passwordConfirm')}
                  disabled={loading}
                />
              </>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isVerified}
                  onChange={handleCheckboxChange}
                  disabled={loading}
                />
              }
              label="Verified"
            />

            {isManagerRole && (
              <FormControl fullWidth>
                <InputLabel>Assign to Projects</InputLabel>
                <Select
                  multiple
                  value={selectedProjects}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedProjects(typeof value === 'string' ? value.split(',') : value);
                  }}
                  input={<OutlinedInput label="Assign to Projects" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((projectId) => {
                        const project = availableProjects.find(p => p.id === projectId);
                        return (
                          <Chip
                            key={projectId}
                            label={project?.name || projectId}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                  disabled={loading}
                >
                  {availableProjects.map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {error && (
              <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>
                {error}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading
              ? (editUser ? 'Updating...' : 'Creating...')
              : (editUser ? 'Update User' : 'Create User')
            }
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
