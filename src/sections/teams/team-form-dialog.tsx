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

type TeamFormDialogProps = {
  open: boolean;
  team?: {
    id: string;
    name: string;
    plan: string;
    logo_url: string | null;
  } | null;
  onClose: () => void;
  onSave: (values: { name: string; plan: string }) => Promise<void>;
};

export function TeamFormDialog({ open, team, onClose, onSave }: TeamFormDialogProps) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState('Free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (team) {
      setName(team.name);
      setPlan(team.plan);
    } else {
      setName('');
      setPlan('Free');
    }
    setError('');
  }, [team, open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Team name is required');
      return;
    }

    try {
      setSaving(true);
      await onSave({ name: name.trim(), plan });
    } catch (err) {
      setError('Failed to save team. Please try again.');
      console.error('Error saving team:', err);
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
        <DialogTitle>{team ? 'Edit team' : 'Create new team'}</DialogTitle>

        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Team name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!error && !name.trim()}
              helperText={error && !name.trim() ? error : ''}
              disabled={saving}
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
            {saving ? 'Saving...' : team ? 'Save changes' : 'Create team'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
