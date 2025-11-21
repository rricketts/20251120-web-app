import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

type Integration = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  comingSoon?: boolean;
};

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      description: 'Track and analyze website traffic and user behavior',
      icon: 'logos:google-analytics',
      connected: false,
    },
    {
      id: 'google-search-console',
      name: 'Google Search Console',
      description: 'Monitor and optimize your site\'s search performance',
      icon: 'logos:google-icon',
      connected: false,
    },
    {
      id: 'shopify',
      name: 'Shopify',
      description: 'Connect your e-commerce store',
      icon: 'logos:shopify',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'wix',
      name: 'Wix',
      description: 'Integrate with your Wix website',
      icon: 'logos:wix',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'wordpress',
      name: 'WordPress',
      description: 'Connect your WordPress site',
      icon: 'logos:wordpress-icon',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'webflow',
      name: 'Webflow',
      description: 'Sync with your Webflow projects',
      icon: 'logos:webflow',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'google-ads',
      name: 'Google Ads',
      description: 'Manage and track your advertising campaigns',
      icon: 'logos:google-ads',
      connected: false,
      comingSoon: true,
    },
    {
      id: 'google-business-profile',
      name: 'Google Business Profile',
      description: 'Manage your business presence on Google',
      icon: 'logos:google-icon',
      connected: false,
      comingSoon: true,
    },
  ]);

  const handleToggle = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, connected: !integration.connected }
          : integration
      )
    );
  };

  const activeIntegrations = integrations.filter(i => !i.comingSoon);
  const comingSoonIntegrations = integrations.filter(i => i.comingSoon);

  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Integrations</Typography>
      </Stack>

      <Grid container spacing={3}>
        {activeIntegrations.map((integration) => (
          <Grid key={integration.id} item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 1.5,
                        bgcolor: 'background.neutral',
                      }}
                    >
                      <Iconify icon={integration.icon} width={32} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6">{integration.name}</Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {integration.description}
                  </Typography>

                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={integration.connected}
                          onChange={() => handleToggle(integration.id)}
                        />
                      }
                      label={integration.connected ? 'Connected' : 'Disconnected'}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={!integration.connected}
                    >
                      Configure
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {comingSoonIntegrations.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 5, mb: 3 }}>
            Coming Soon
          </Typography>

          <Grid container spacing={3}>
            {comingSoonIntegrations.map((integration) => (
              <Grid key={integration.id} item xs={12} sm={6} md={4}>
                <Card sx={{ opacity: 0.7 }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'background.neutral',
                          }}
                        >
                          <Iconify icon={integration.icon} width={32} />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h6">{integration.name}</Typography>
                            <Chip label="Coming Soon" size="small" color="default" />
                          </Stack>
                        </Box>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {integration.description}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </DashboardContent>
  );
}
