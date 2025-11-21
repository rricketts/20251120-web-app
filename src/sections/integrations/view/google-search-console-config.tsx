import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

type PropertyType = {
  url: string;
  permissionLevel: string;
};

export function GoogleSearchConsoleConfig() {
  const [apiKey, setApiKey] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    setProperties([
      { url: 'https://example.com', permissionLevel: 'Owner' },
      { url: 'https://blog.example.com', permissionLevel: 'Full' },
      { url: 'https://shop.example.com', permissionLevel: 'Full' },
    ]);

    setIsConnected(true);
    setIsConnecting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSaving(false);
  };

  const handleDisconnect = () => {
    setApiKey('');
    setClientId('');
    setClientSecret('');
    setSelectedProperty('');
    setProperties([]);
    setIsConnected(false);
  };

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Google Search Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure your Google Search Console integration
          </Typography>
        </Box>
      </Stack>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Iconify icon="logos:google-icon" width={48} />
              </Box>
              <Box>
                <Typography variant="h6">Google Search Console API</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monitor and optimize your site's search performance
                </Typography>
              </Box>
            </Box>

            {!isConnected ? (
              <>
                <Typography variant="subtitle2" color="text.secondary">
                  To connect Google Search Console, you'll need to create OAuth 2.0 credentials
                  in the Google Cloud Console.
                </Typography>

                <TextField
                  fullWidth
                  label="Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your OAuth 2.0 Client ID"
                />

                <TextField
                  fullWidth
                  label="Client Secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="Enter your OAuth 2.0 Client Secret"
                />

                <TextField
                  fullWidth
                  label="API Key (Optional)"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API Key"
                />

                <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    How to get your credentials:
                  </Typography>
                  <Typography variant="body2" component="div" color="text.secondary">
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      <li>Go to the Google Cloud Console</li>
                      <li>Create a new project or select an existing one</li>
                      <li>Enable the Google Search Console API</li>
                      <li>Create OAuth 2.0 credentials (Web application)</li>
                      <li>Add authorized redirect URIs</li>
                      <li>Copy your Client ID and Client Secret</li>
                    </ol>
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={!clientId || !clientSecret || isConnecting}
                    startIcon={
                      isConnecting ? (
                        <Iconify icon="svg-spinners:3-dots-fade" />
                      ) : (
                        <Iconify icon="eva:link-2-fill" />
                      )
                    }
                  >
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </Button>
                </Stack>
              </>
            ) : (
              <>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    bgcolor: 'success.lighter',
                    border: (theme) => `1px solid ${theme.palette.success.main}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="eva:checkmark-circle-2-fill" color="success.main" width={24} />
                    <Typography variant="subtitle2" color="success.darker">
                      Successfully connected to Google Search Console
                    </Typography>
                  </Stack>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Select Property</InputLabel>
                  <Select
                    value={selectedProperty}
                    label="Select Property"
                    onChange={(e) => setSelectedProperty(e.target.value)}
                  >
                    {properties.map((property) => (
                      <MenuItem key={property.url} value={property.url}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ width: '100%' }}>
                          <Typography sx={{ flex: 1 }}>{property.url}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {property.permissionLevel}
                          </Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedProperty && (
                  <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Property Details
                    </Typography>
                    <Stack spacing={1}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          URL:
                        </Typography>
                        <Typography variant="body2">{selectedProperty}</Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Permission:
                        </Typography>
                        <Typography variant="body2">
                          {properties.find((p) => p.url === selectedProperty)?.permissionLevel}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                )}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleDisconnect}
                    startIcon={<Iconify icon="eva:close-fill" />}
                  >
                    Disconnect
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={!selectedProperty || isSaving}
                    startIcon={
                      isSaving ? (
                        <Iconify icon="svg-spinners:3-dots-fade" />
                      ) : (
                        <Iconify icon="eva:save-fill" />
                      )
                    }
                  >
                    {isSaving ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
