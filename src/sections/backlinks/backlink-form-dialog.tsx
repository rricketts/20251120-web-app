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

import { supabase } from 'src/lib/supabase';
import { useAuth } from 'src/contexts/auth-context';

type BacklinkFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
  editData?: {
    id: string;
    backlink: string;
    nofollow: boolean;
    anchor_text: string;
    anchor_url: string;
    google_pr: number;
    alexa_rank: number;
  } | null;
};

export function BacklinkFormDialog({ open, onClose, onSuccess, projectId, editData }: BacklinkFormDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    backlink: editData?.backlink || '',
    nofollow: editData?.nofollow || false,
    anchor_text: editData?.anchor_text || '',
    anchor_url: editData?.anchor_url || '',
    google_pr: editData?.google_pr || 0,
    alexa_rank: editData?.alexa_rank || 0,
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
          .from('backlinks')
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
        const { error: insertError } = await supabase.from('backlinks').insert({
          ...formData,
          user_id: user?.id,
          project_id: projectId,
        });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
      setFormData({
        backlink: '',
        nofollow: false,
        anchor_text: '',
        anchor_url: '',
        google_pr: 0,
        alexa_rank: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save backlink');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        backlink: '',
        nofollow: false,
        anchor_text: '',
        anchor_url: '',
        google_pr: 0,
        alexa_rank: 0,
      });
      setError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editData ? 'Edit Backlink' : 'Add New Backlink'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Backlink URL"
              value={formData.backlink}
              onChange={(e) => setFormData({ ...formData, backlink: e.target.value })}
              disabled={loading}
              placeholder="https://example.com/page"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.nofollow}
                  onChange={(e) => setFormData({ ...formData, nofollow: e.target.checked })}
                  disabled={loading}
                />
              }
              label="Nofollow"
            />
            <TextField
              required
              fullWidth
              label="Anchor Text"
              value={formData.anchor_text}
              onChange={(e) => setFormData({ ...formData, anchor_text: e.target.value })}
              disabled={loading}
              placeholder="Click here"
            />
            <TextField
              required
              fullWidth
              label="Anchor URL"
              value={formData.anchor_url}
              onChange={(e) => setFormData({ ...formData, anchor_url: e.target.value })}
              disabled={loading}
              placeholder="https://yoursite.com/landing"
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
