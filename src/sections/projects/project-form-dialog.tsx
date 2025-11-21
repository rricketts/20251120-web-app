import type { SelectChangeEvent } from '@mui/material/Select';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { supabase } from 'src/lib/supabase';

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

export function ProjectFormDialog({ open, project, onClose, onSave, currentUserRole }: ProjectFormDialogProps) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Free');
  const [managerId, setManagerId] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

    if (project) {
      setName(project.name);
      setPlan(project.plan);
      setManagerId('');
    } else {
      setName('');
      setPlan('Free');
      setManagerId('');
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
