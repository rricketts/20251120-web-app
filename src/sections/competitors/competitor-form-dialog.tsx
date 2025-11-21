import { useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';

type CompetitorFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
  editData?: {
    id: string;
    domain: string;
    google_pr: number;
    alexa_rank: number;
    age: string;
    pages_in_google: number;
    backlinks: number;
    visibility: number;
  } | null;
};

export function CompetitorFormDialog({ open, onClose, onSuccess, projectId, editData }: CompetitorFormDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    domain: editData?.domain || '',
    google_pr: editData?.google_pr || 0,
    alexa_rank: editData?.alexa_rank || 0,
    age: editData?.age || '',
    pages_in_google: editData?.pages_in_google || 0,
    backlinks: editData?.backlinks || 0,
    visibility: editData?.visibility || 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (editData) {
        const { error: updateError } = await supabase
          .from('competitors')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editData.id);

        if (updateError) throw updateError;
      } else {
        if (!projectId) {
          throw new Error('Project is required');
        }
        const { error: insertError } = await supabase.from('competitors').insert({
          ...formData,
          user_id: user?.id,
          project_id: projectId,
        });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
      setFormData({
        domain: '',
        google_pr: 0,
        alexa_rank: 0,
        age: '',
        pages_in_google: 0,
        backlinks: 0,
        visibility: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save competitor');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        domain: '',
        google_pr: 0,
        alexa_rank: 0,
        age: '',
        pages_in_google: 0,
        backlinks: 0,
        visibility: 0,
      });
      setError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editData ? 'Edit Competitor' : 'Add New Competitor'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Domain"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              disabled={loading}
              placeholder="example.com"
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Google PR"
              value={formData.google_pr}
              onChange={(e) => setFormData({ ...formData, google_pr: parseInt(e.target.value, 10) || 0 })}
              disabled={loading}
              inputProps={{ min: 0, max: 10 }}
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Alexa Rank"
              value={formData.alexa_rank}
              onChange={(e) => setFormData({ ...formData, alexa_rank: parseInt(e.target.value, 10) || 0 })}
              disabled={loading}
              inputProps={{ min: 0 }}
            />
            <TextField
              required
              fullWidth
              label="Age"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              disabled={loading}
              placeholder="5 years"
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Pages in Google"
              value={formData.pages_in_google}
              onChange={(e) => setFormData({ ...formData, pages_in_google: parseInt(e.target.value, 10) || 0 })}
              disabled={loading}
              inputProps={{ min: 0 }}
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Backlinks"
              value={formData.backlinks}
              onChange={(e) => setFormData({ ...formData, backlinks: parseInt(e.target.value, 10) || 0 })}
              disabled={loading}
              inputProps={{ min: 0 }}
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Visibility (%)"
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: parseFloat(e.target.value) || 0 })}
              disabled={loading}
              inputProps={{ min: 0, max: 100, step: 0.01 }}
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
            {loading ? 'Saving...' : editData ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
