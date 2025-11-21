import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientId: string, clientSecret: string) => void;
  initialClientId?: string;
  initialClientSecret?: string;
}

export function ConfigModal({
  isOpen,
  onClose,
  onSave,
  initialClientId = '',
  initialClientSecret = '',
}: ConfigModalProps) {
  const [clientId, setClientId] = useState(initialClientId);
  const [clientSecret, setClientSecret] = useState(initialClientSecret);

  useEffect(() => {
    setClientId(initialClientId);
    setClientSecret(initialClientSecret);
  }, [initialClientId, initialClientSecret]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clientId.trim() && clientSecret.trim()) {
      onSave(clientId.trim(), clientSecret.trim());
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Iconify icon="solar:settings-bold-duotone" width={24} />
            <Typography variant="h6">Configure Google OAuth</Typography>
          </Stack>
          <IconButton onClick={onClose} size="small">
            <Iconify icon="solar:close-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Stack spacing={3}>
            <Alert severity="info">
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Setup Instructions
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.875rem' }}>
                <li>Go to Google Cloud Console</li>
                <li>Create or select a project</li>
                <li>Enable the Search Console API</li>
                <li>Create OAuth 2.0 credentials</li>
                <li>
                  Add authorized redirect URI:{' '}
                  <Box
                    component="code"
                    sx={{ bgcolor: 'action.hover', px: 0.5, py: 0.25, borderRadius: 0.5 }}
                  >
                    {window.location.origin}/callback
                  </Box>
                </li>
                <li>Copy your Client ID and Client Secret below</li>
              </Box>
            </Alert>

            <TextField
              fullWidth
              label="Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="123456789-abcdefg.apps.googleusercontent.com"
              required
            />

            <TextField
              fullWidth
              label="Client Secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="GOCSPX-..."
              required
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
