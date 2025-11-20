import type { SelectChangeEvent } from '@mui/material/Select';

import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

type ProjectFormDialogProps = {
  open: boolean;
  project?: {
    id: string;
    name: string;
    plan: string;
    logo_url: string | null;
  } | null;
  onClose: () => void;
  onSave: (values: { name: string; plan: string }) => Promise<void>;
};

export function ProjectFormDialog({ open, project, onClose, onSave }: ProjectFormDialogProps) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setPlan(project.plan);
    } else {
      setName('');
      setPlan('Free');
    }
    setError('');
  }, [project, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Domain name is required');
      return;
    }

    try {
      setSaving(true);
      await onSave({ name: name.trim(), plan });
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

            {error && name.trim() && (
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
