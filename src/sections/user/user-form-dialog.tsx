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

import type { UserProps } from './user-table-row';

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editUser?: UserProps | null;
};

const ROLES = [
  'Leader',
  'Hr Manager',
  'UI Designer',
  'UX Designer',
  'UI/UX Designer',
  'Project Manager',
  'Backend Developer',
  'Full Stack Designer',
  'Front End Developer',
  'Full Stack Developer',
];

export function UserFormDialog({ open, onClose, onSuccess, editUser }: UserFormDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'UI Designer',
    isVerified: false,
    status: 'active',
    avatarUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editUser) {
      setFormData({
        name: editUser.name,
        email: '',
        company: editUser.company,
        role: editUser.role,
        isVerified: editUser.isVerified,
        status: editUser.status,
        avatarUrl: editUser.avatarUrl,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        company: '',
        role: 'UI Designer',
        isVerified: false,
        status: 'active',
        avatarUrl: '',
      });
    }
  }, [editUser, open]);

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
            company: formData.company,
            role: formData.role,
            is_verified: formData.isVerified,
            status: formData.status,
            avatar_url: formData.avatarUrl || null,
          })
          .eq('id', editUser.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase.from('users').insert([
          {
            name: formData.name,
            email: formData.email,
            company: formData.company,
            role: formData.role,
            is_verified: formData.isVerified,
            status: formData.status,
            avatar_url: formData.avatarUrl || null,
          },
        ]);

        if (insertError) throw insertError;
      }

      setFormData({
        name: '',
        email: '',
        company: '',
        role: 'UI Designer',
        isVerified: false,
        status: 'active',
        avatarUrl: '',
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
              label="Company"
              value={formData.company}
              onChange={handleChange('company')}
              disabled={loading}
            />

            <TextField
              required
              fullWidth
              select
              label="Role"
              value={formData.role}
              onChange={handleChange('role')}
              disabled={loading}
            >
              {ROLES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Avatar URL"
              placeholder="/assets/images/avatar/avatar-1.webp"
              value={formData.avatarUrl}
              onChange={handleChange('avatarUrl')}
              disabled={loading}
              helperText="Optional: Path to avatar image"
            />

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
