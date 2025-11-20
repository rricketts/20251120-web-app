import { useState } from 'react';

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

type UserFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
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

export function UserFormDialog({ open, onClose, onSuccess }: UserFormDialogProps) {
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
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
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
      <DialogTitle>Add New User</DialogTitle>
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

            <TextField
              required
              fullWidth
              type="email"
              label="Email"
              value={formData.email}
              onChange={handleChange('email')}
              disabled={loading}
            />

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
            {loading ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
