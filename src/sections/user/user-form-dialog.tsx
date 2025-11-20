import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import MenuItem from '@mui/material/MenuItem';

import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';

import type { UserProps } from './user-table-row';

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: UserProps | null;
  currentUserRole?: string;
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
  const availableRoles = getRolesForUser(currentUserRole);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: availableRoles.length > 0 ? availableRoles[availableRoles.length - 1] : 'user',
    isVerified: false,
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name,
        email: '',
        role: editUser.role,
        isVerified: editUser.isVerified,
        status: editUser.status,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: availableRoles.length > 0 ? availableRoles[availableRoles.length - 1] : 'user',
        isVerified: false,
        status: 'active',
      });
    }
  }, [editUser, open, availableRoles]);

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

    try {
      if (editUser) {
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
      } else {
        const { error: insertError } = await supabase.from('users').insert([
          {
            name: formData.name,
            email: formData.email,
            role: formData.role,
            is_verified: formData.isVerified,
            status: formData.status,
          },
        ]);

        if (insertError) throw insertError;
      }

      setFormData({
        name: '',
        email: '',
        role: availableRoles.length > 0 ? availableRoles[availableRoles.length - 1] : 'user',
        isVerified: false,
        status: 'active',
      });

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
              label="Name"
              value={formData.name}
              onChange={handleChange('name')}
              disabled={loading}
            />

            {!editUser && (
              <TextField
                required
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange('email')}
                disabled={loading}
              />
            )}

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
