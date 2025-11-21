import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { supabase, type OAuthConnection } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';
import { generateAuthUrl, fetchSearchConsoleSites, fetchSearchAnalytics, refreshAccessToken } from 'src/lib/googleAuth';

import { Iconify } from 'src/components/iconify';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface Site {
  siteUrl: string;
  permissionLevel: string;
}

interface AnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export function GoogleSearchConsoleConfig() {
  const [connection, setConnection] = useState<OAuthConnection | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    loadConnection();

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth_success') {
        setIsConnecting(false);
        loadConnection();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (connection && sites.length === 0) {
      loadSites();
    }
  }, [connection]);

  useEffect(() => {
    if (selectedSite && connection) {
      loadAnalytics();
    }
  }, [selectedSite]);


  const loadConnection = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('provider', 'google_search_console')
        .maybeSingle();

      if (fetchError) throw fetchError;
      setConnection(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connection');
    } finally {
      setLoading(false);
    }
  };

  const loadSites = async () => {
    if (!connection) return;

    try {
      setError('');
      const data = await fetchSearchConsoleSites(connection.access_token);
      setSites(data.siteEntry || []);
      if (data.siteEntry && data.siteEntry.length > 0) {
        setSelectedSite(data.siteEntry[0].siteUrl);
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        await handleTokenRefresh();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load sites');
      }
    }
  };

  const loadAnalytics = async () => {
    if (!connection || !selectedSite) return;

    try {
      setError('');
      setRefreshing(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 28);

      const formatDate = (date: Date) => date.toISOString().split('T')[0];

      const data = await fetchSearchAnalytics(
        connection.access_token,
        selectedSite,
        formatDate(startDate),
        formatDate(endDate)
      );

      setAnalytics(data.rows || []);
    } catch (err) {
      if (err instanceof Error && err.message === 'TOKEN_EXPIRED') {
        await handleTokenRefresh();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleTokenRefresh = async () => {
    if (!connection?.refresh_token) {
      setError('No refresh token available. Please reconnect.');
      return;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError('User not authenticated');
        return;
      }

      const newAccessToken = await refreshAccessToken(
        connection.refresh_token,
        import.meta.env.VITE_SUPABASE_URL,
        session.access_token
      );

      const { error: updateError } = await supabase
        .from('oauth_connections')
        .update({ access_token: newAccessToken })
        .eq('id', connection.id);

      if (updateError) throw updateError;

      setConnection({ ...connection, access_token: newAccessToken });
      await loadSites();
    } catch (err) {
      setError('Failed to refresh token. Please reconnect.');
    }
  };


  const handleConnect = async () => {
    setIsConnecting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const state = crypto.randomUUID();

      const { error: insertError } = await supabase
        .from('oauth_states')
        .insert({
          user_id: user.id,
          state,
        });

      if (insertError) throw insertError;

      const authUrl = generateAuthUrl(GOOGLE_CLIENT_ID, state);
      window.open(authUrl, '_blank', 'width=600,height=700');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    try {
      const { error: deleteError } = await supabase
        .from('oauth_connections')
        .delete()
        .eq('id', connection.id);

      if (deleteError) throw deleteError;

      setConnection(null);
      setSites([]);
      setSelectedSite('');
      setAnalytics([]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const calculateTotals = () => {
    return analytics.reduce(
      (acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions,
        avgCtr: acc.avgCtr + row.ctr,
        avgPosition: acc.avgPosition + row.position,
      }),
      { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0 }
    );
  };

  if (loading) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardContent>
    );
  }

  const totals = calculateTotals();

  return (
    <DashboardContent maxWidth="xl">
      <Stack spacing={3}>
        <Typography variant="h4">Google Search Console</Typography>

        {error && (
          <Alert severity="error" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {!connection ? (
          <Card>
            <CardContent>
              <Stack spacing={3} alignItems="center" sx={{ py: 5 }}>
                <Iconify icon="logos:google" width={64} />
                <Typography variant="h6">Connect Google Search Console</Typography>
                <Typography color="text.secondary" textAlign="center" sx={{ maxWidth: 480 }}>
                  Connect your Google Search Console account to view your website's search analytics and
                  performance metrics.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Iconify icon="solar:link-bold" />}
                  onClick={handleConnect}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect with Google'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ) : (
          <>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Connected</Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<Iconify icon="solar:link-broken-bold" />}
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </Stack>

            {sites.length > 0 && (
              <Card>
                <CardContent>
                  <FormControl fullWidth>
                    <InputLabel>Select Property</InputLabel>
                    <Select
                      value={selectedSite}
                      label="Select Property"
                      onChange={(e) => setSelectedSite(e.target.value)}
                    >
                      {sites.map((site) => (
                        <MenuItem key={site.siteUrl} value={site.siteUrl}>
                          {site.siteUrl}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </CardContent>
              </Card>
            )}

            {analytics.length > 0 && (
              <>
                <Stack direction="row" spacing={2}>
                  <Card sx={{ flex: 1 }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'primary.lighter',
                          }}
                        >
                          <Iconify icon="solar:cursor-bold" width={24} sx={{ color: 'primary.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Clicks
                          </Typography>
                          <Typography variant="h4">{totals.clicks.toLocaleString()}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1 }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'success.lighter',
                          }}
                        >
                          <Iconify icon="solar:eye-bold" width={24} sx={{ color: 'success.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Impressions
                          </Typography>
                          <Typography variant="h4">{totals.impressions.toLocaleString()}</Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1 }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'warning.lighter',
                          }}
                        >
                          <Iconify icon="solar:chart-bold" width={24} sx={{ color: 'warning.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Avg. CTR
                          </Typography>
                          <Typography variant="h4">
                            {((totals.avgCtr / analytics.length) * 100).toFixed(2)}%
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>

                  <Card sx={{ flex: 1 }}>
                    <CardContent>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1.5,
                            bgcolor: 'info.lighter',
                          }}
                        >
                          <Iconify icon="solar:target-bold" width={24} sx={{ color: 'info.main' }} />
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Avg. Position
                          </Typography>
                          <Typography variant="h4">
                            {(totals.avgPosition / analytics.length).toFixed(1)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>

                <Card>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3, pb: 0 }}>
                    <Typography variant="h6">Top Queries (Last 28 Days)</Typography>
                    <Button
                      size="small"
                      startIcon={<Iconify icon="solar:refresh-bold" />}
                      onClick={loadAnalytics}
                      disabled={refreshing}
                    >
                      Refresh
                    </Button>
                  </Stack>
                  <Box sx={{ overflow: 'auto' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Query</TableCell>
                          <TableCell align="right">Clicks</TableCell>
                          <TableCell align="right">Impressions</TableCell>
                          <TableCell align="right">CTR</TableCell>
                          <TableCell align="right">Position</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {analytics.map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{row.keys[0]}</TableCell>
                            <TableCell align="right">{row.clicks}</TableCell>
                            <TableCell align="right">{row.impressions.toLocaleString()}</TableCell>
                            <TableCell align="right">{(row.ctr * 100).toFixed(2)}%</TableCell>
                            <TableCell align="right">{row.position.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </>
            )}

            {sites.length === 0 && !error && (
              <Card>
                <CardContent>
                  <Stack spacing={2} alignItems="center" sx={{ py: 5 }}>
                    <Iconify icon="solar:inbox-bold-duotone" width={64} />
                    <Typography color="text.secondary">
                      No properties found in your Search Console account.
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
    </DashboardContent>
  );
}
