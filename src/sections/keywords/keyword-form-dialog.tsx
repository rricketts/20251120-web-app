
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

type KeywordFormDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
  editData?: {
    id: string;
    keyword: string;
    google_rank: number;
    visibility: number;
    kei: number;
    expected_traffic: number;
  } | null;
};

export function KeywordFormDialog({ open, onClose, onSuccess, projectId, editData }: KeywordFormDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    keyword: editData?.keyword || '',
    google_rank: editData?.google_rank || 0,
    visibility: editData?.visibility || 0,
    kei: editData?.kei || 0,
    expected_traffic: editData?.expected_traffic || 0,
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
          .from('keywords')
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
        const { error: insertError } = await supabase.from('keywords').insert({
          ...formData,
          user_id: user?.id,
          project_id: projectId,
        });

        if (insertError) throw insertError;
      }

      onSuccess();
      onClose();
      setFormData({
        keyword: '',
        google_rank: 0,
        visibility: 0,
        kei: 0,
        expected_traffic: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save keyword');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setFormData({
        keyword: '',
        google_rank: 0,
        visibility: 0,
        kei: 0,
        expected_traffic: 0,
      });
      setError('');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{editData ? 'Edit Keyword' : 'Add New Keyword'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label="Keyword"
              value={formData.keyword}
              onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
              disabled={loading}
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Google Rank"
              value={formData.google_rank}
              onChange={(e) => setFormData({ ...formData, google_rank: parseInt(e.target.value, 10) || 0 })}
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
            <TextField
              required
              fullWidth
              type="number"
              label="KEI"
              value={formData.kei}
              onChange={(e) => setFormData({ ...formData, kei: parseFloat(e.target.value) || 0 })}
              disabled={loading}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              required
              fullWidth
              type="number"
              label="Expected Traffic"
              value={formData.expected_traffic}
              onChange={(e) => setFormData({ ...formData, expected_traffic: parseInt(e.target.value, 10) || 0 })}
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
