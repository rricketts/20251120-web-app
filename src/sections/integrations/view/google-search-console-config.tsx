import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';

import { supabase } from 'src/lib/supabase';
import { useProject } from 'src/contexts/project-context';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

type PropertyType = {
  url: string;
  permissionLevel: string;
};

const OAUTH_CONFIG = {
  clientId: '530759122152-hoc2fmn25t2b0jjvhg1ikoi5afcnbgdr.apps.googleusercontent.com',
  redirectUri: `${window.location.origin}/integrations/google-search-console`,
  scope: 'https://www.googleapis.com/auth/webmasters.readonly',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
};

export function GoogleSearchConsoleConfig() {
  console.log('='.repeat(80));
  console.log('[GSC Init] GoogleSearchConsoleConfig component is initializing');
  console.log('[GSC Init] Current URL:', window.location.href);
  console.log('[GSC Init] URL pathname:', window.location.pathname);
  console.log('[GSC Init] URL search:', window.location.search);
  console.log('[GSC Init] URL hash:', window.location.hash);
  console.log('='.repeat(80));

  const { selectedProject } = useProject();
  console.log('[GSC Init] Selected project:', selectedProject);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [properties, setProperties] = useState<PropertyType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  console.log('[GSC Init] Initial state set - isLoading:', true, 'isConnecting:', false);

  const addDebugLog = (message: string) => {
    const logMessage = `${new Date().toISOString()}: ${message}`;
    console.log(`[GSC Debug] ${logMessage}`);
    setDebugLog(prev => [...prev, logMessage]);
  };

  useEffect(() => {
    addDebugLog(`State Update - isLoading: ${isLoading}, isConnecting: ${isConnecting}, isConnected: ${isConnected}, properties: ${properties.length}, accessToken: ${accessToken ? 'present' : 'null'}`);
  }, [isLoading, isConnecting, isConnected, properties, accessToken]);

  useEffect(() => {
    console.log('[GSC UseEffect] Main useEffect triggered');
    const handleInit = async () => {
      console.log('[GSC UseEffect] handleInit starting');
      addDebugLog('Component mounted');
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const errorParam = params.get('error');

      console.log('[GSC UseEffect] Parsed URL params - code:', code?.substring(0, 20) + '...', 'error:', errorParam);
      addDebugLog(`URL params - code: ${code ? 'present' : 'none'}, error: ${errorParam || 'none'}`);

      if (errorParam) {
        console.log('[GSC UseEffect] Error param detected, showing error');
        addDebugLog(`OAuth error detected: ${errorParam}`);
        setError('Authorization was cancelled or failed');
        setIsLoading(false);
        window.history.replaceState({}, '', window.location.pathname);
        return;
      }

      if (code) {
        console.log('[GSC UseEffect] OAuth code detected, calling handleOAuthCallback');
        addDebugLog('OAuth code detected, starting callback handler');
        await handleOAuthCallback(code);
        console.log('[GSC UseEffect] handleOAuthCallback completed');
        return;
      }

      if (selectedProject) {
        console.log('[GSC UseEffect] No code, loading existing config for project:', selectedProject.id);
        addDebugLog(`Loading config for project: ${selectedProject.id}`);
        await loadExistingConfig();
        console.log('[GSC UseEffect] loadExistingConfig completed');
      } else {
        console.log('[GSC UseEffect] No project selected, setting isLoading to false');
        addDebugLog('No project selected');
        setIsLoading(false);
      }
    };

    handleInit().catch(err => {
      console.error('[GSC UseEffect] Error in handleInit:', err);
      addDebugLog(`Error in handleInit: ${err.message}`);
    });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (!code && selectedProject && !isConnecting) {
      addDebugLog(`Project changed to: ${selectedProject.id}, reloading config`);
      loadExistingConfig();
    }
  }, [selectedProject]);

  const loadExistingConfig = async () => {
    console.log('[GSC Load] Loading existing config for project:', selectedProject?.id);
    if (!selectedProject) {
      console.log('[GSC Load] No project selected, returning');
      return;
    }

    try {
      console.log('[GSC Load] Fetching existing config from database');
      addDebugLog('Fetching existing config from database');
      const { data, error: fetchError } = await supabase
        .from('integration_credentials')
        .select('*')
        .eq('project_id', selectedProject.id)
        .eq('integration_type', 'google_search_console')
        .eq('is_active', true)
        .maybeSingle();

      console.log('[GSC Load] Database query result:', { data, error: fetchError });
      if (fetchError) {
        console.error('[GSC Load] Database fetch error:', fetchError);
        addDebugLog(`Database fetch error: ${JSON.stringify(fetchError)}`);
        throw fetchError;
      }

      if (data) {
        console.log('[GSC Load] RAW EXISTING CONFIG DATA:', JSON.stringify(data, null, 2));
        addDebugLog('Existing config found, setting connected state');
        addDebugLog(`Config data: ${JSON.stringify(data)}`);
        console.log('[GSC Load] Setting isConnected=true');
        setIsConnected(true);
        console.log('[GSC Load] Setting selectedProperty:', data.selected_property);
        setSelectedProperty(data.selected_property || '');
        console.log('[GSC Load] Setting accessToken (length):', data.access_token?.length);
        setAccessToken(data.access_token);
        if (data.access_token) {
          console.log('[GSC Load] Access token found, fetching properties');
          addDebugLog('Access token found, fetching properties');
          await fetchProperties(data.access_token);
        }
      } else {
        console.log('[GSC Load] No existing config found');
        addDebugLog('No existing config found');
      }
    } catch (err) {
      console.error('[GSC Load] Error loading config:', err);
      addDebugLog(`Error loading config: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error loading config:', err);
    } finally {
      console.log('[GSC Load] Load config complete, setting isLoading=false');
      addDebugLog('Load config complete');
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    addDebugLog('Initiating OAuth connection');
    const state = crypto.randomUUID();
    sessionStorage.setItem('oauth_state', state);
    addDebugLog(`OAuth state generated: ${state}`);
    addDebugLog(`Redirect URI: ${OAUTH_CONFIG.redirectUri}`);

    const authParams = new URLSearchParams({
      client_id: OAUTH_CONFIG.clientId,
      redirect_uri: OAUTH_CONFIG.redirectUri,
      response_type: 'code',
      scope: OAUTH_CONFIG.scope,
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    const authUrl = `${OAUTH_CONFIG.authUrl}?${authParams.toString()}`;
    addDebugLog(`Redirecting to: ${authUrl}`);
    window.location.href = authUrl;
  };

  const handleOAuthCallback = async (code: string) => {
    console.log('[GSC OAuth] ========== STARTING OAUTH CALLBACK ==========');
    console.log('[GSC OAuth] Code length:', code.length);
    console.log('[GSC OAuth] Code preview:', code.substring(0, 20) + '...');
    addDebugLog(`Starting OAuth callback with code: ${code.substring(0, 10)}...`);
    console.log('[GSC OAuth] Setting isConnecting to true');
    setIsConnecting(true);
    setError(null);

    try {
      console.log('[GSC OAuth] Exchanging code for token');
      addDebugLog('Exchanging code for token via Edge Function');
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-exchange`;
      console.log('[GSC OAuth] API URL:', apiUrl);

      console.log('[GSC OAuth] Making fetch request...');
      const tokenResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirectUri: OAUTH_CONFIG.redirectUri,
        }),
      });

      console.log('[GSC OAuth] Token response received - status:', tokenResponse.status);
      addDebugLog(`Token response status: ${tokenResponse.status}`);

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        addDebugLog(`Token exchange failed: ${errorText}`);
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await tokenResponse.json();
      console.log('[GSC OAuth] RAW TOKEN DATA:', JSON.stringify(tokenData, null, 2));
      addDebugLog('Token received successfully');
      addDebugLog(`Token data: ${JSON.stringify(tokenData)}`);
      addDebugLog(`Token has refresh_token: ${!!tokenData.refresh_token}`);
      addDebugLog(`Access token length: ${tokenData.access_token?.length || 0}`);
      addDebugLog(`Refresh token length: ${tokenData.refresh_token?.length || 0}`);
      addDebugLog(`Expires in: ${tokenData.expires_in} seconds`);
      console.log('[GSC OAuth] Setting access token in state');
      setAccessToken(tokenData.access_token);

      console.log('[GSC OAuth] Fetching properties with new token');
      addDebugLog('Fetching properties with new token');
      await fetchProperties(tokenData.access_token);

      console.log('[GSC OAuth] Getting user data from Supabase');
      addDebugLog('Getting user data');
      const { data: userData, error: userError } = await supabase.auth.getUser();
      console.log('[GSC OAuth] User data result:', { user: userData?.user?.id, error: userError });
      if (!userData.user) {
        addDebugLog('No user found in session');
        throw new Error('User not found');
      }
      if (!selectedProject) {
        addDebugLog('No project selected');
        throw new Error('Project not found');
      }
      console.log('[GSC OAuth] User ID:', userData.user.id, 'Project ID:', selectedProject.id);
      addDebugLog(`User ID: ${userData.user.id}, Project ID: ${selectedProject.id}`);

      const credentialsToSave = {
        project_id: selectedProject.id,
        integration_type: 'google_search_console',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expiry: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        is_active: true,
        created_by: userData.user.id,
      };
      console.log('[GSC OAuth] Credentials to save:', JSON.stringify(credentialsToSave, null, 2));
      addDebugLog('Saving credentials to database');
      addDebugLog(`Credentials payload: ${JSON.stringify(credentialsToSave)}`);

      const { data: saveData, error: saveError } = await supabase
        .from('integration_credentials')
        .upsert(credentialsToSave, {
          onConflict: 'project_id,integration_type',
        })
        .select();

      console.log('[GSC OAuth] Database save result:', { data: saveData, error: saveError });
      if (saveError) {
        console.error('[GSC OAuth] Database save error:', saveError);
        addDebugLog(`Database save error: ${JSON.stringify(saveError)}`);
        throw saveError;
      }
      console.log('[GSC OAuth] Database save successful, saved data:', JSON.stringify(saveData, null, 2));

      console.log('[GSC OAuth] Credentials saved successfully');
      addDebugLog('Credentials saved successfully');
      console.log('[GSC OAuth] Setting isConnected to true');
      setIsConnected(true);
      addDebugLog('Setting isConnected to true');
      console.log('[GSC OAuth] Cleaning up URL');
      addDebugLog('Cleaning up URL');
      window.history.replaceState({}, '', window.location.pathname);
      console.log('[GSC OAuth] URL cleaned - new URL:', window.location.href);
      addDebugLog('URL cleaned, should render main content now');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[GSC OAuth] ERROR:', err);
      addDebugLog(`OAuth error: ${errorMessage}`);
      console.error('OAuth error:', err);
      setError(`Failed to connect to Google Search Console: ${errorMessage}`);
    } finally {
      console.log('[GSC OAuth] ========== OAUTH CALLBACK COMPLETE ==========');
      console.log('[GSC OAuth] Setting isConnecting=false, isLoading=false');
      addDebugLog('OAuth callback complete - setting isConnecting=false, isLoading=false');
      setIsConnecting(false);
      setIsLoading(false);
      console.log('[GSC OAuth] Final state - isLoading: false, isConnecting: false, isConnected:', isConnected);
      addDebugLog(`Final state after OAuth - isLoading: ${false}, isConnecting: ${false}`);
    }
  };

  const fetchProperties = async (token: string) => {
    console.log('[GSC Fetch] Fetching properties with token (length):', token?.length);
    try {
      console.log('[GSC Fetch] Making request to Google Search Console API');
      addDebugLog('Fetching GSC properties from API');
      const response = await fetch(
        'https://www.googleapis.com/webmasters/v3/sites',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('[GSC Fetch] Response received - status:', response.status, 'statusText:', response.statusText);
      addDebugLog(`Properties response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[GSC Fetch] Properties fetch failed:', errorText);
        addDebugLog(`Properties fetch failed: ${errorText}`);
        throw new Error('Failed to fetch properties');
      }

      const data = await response.json();
      console.log('[GSC Fetch] RAW PROPERTIES RESPONSE:', JSON.stringify(data, null, 2));
      const siteEntries = data.siteEntry || [];
      console.log('[GSC Fetch] Found', siteEntries.length, 'properties');
      addDebugLog(`Found ${siteEntries.length} properties`);
      addDebugLog(`Properties data: ${JSON.stringify(siteEntries.map((s: any) => s.siteUrl))}`);

      const mappedProperties = siteEntries.map((site: any) => ({
        url: site.siteUrl,
        permissionLevel: site.permissionLevel,
      }));

      console.log('[GSC Fetch] Mapped properties:', JSON.stringify(mappedProperties, null, 2));
      addDebugLog(`Setting ${mappedProperties.length} properties in state`);
      setProperties(mappedProperties);
      console.log('[GSC Fetch] Properties set in state');
      addDebugLog('Properties set in state');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[GSC Fetch] Error fetching properties:', err);
      addDebugLog(`Error fetching properties: ${errorMessage}`);
      console.error('Error fetching properties:', err);
      setError(`Failed to fetch Search Console properties: ${errorMessage}`);
    }
  };

  const handleSave = async () => {
    if (!selectedProject || !selectedProperty) return;

    setIsSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from('integration_credentials')
        .update({
          selected_property: selectedProperty,
          is_active: true,
        })
        .eq('project_id', selectedProject.id)
        .eq('integration_type', 'google_search_console');

      if (updateError) throw updateError;

      setError(null);
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Failed to save configuration. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedProject) return;

    try {
      const { error: deleteError } = await supabase
        .from('integration_credentials')
        .delete()
        .eq('project_id', selectedProject.id)
        .eq('integration_type', 'google_search_console');

      if (deleteError) throw deleteError;

      setSelectedProperty('');
      setProperties([]);
      setIsConnected(false);
      setAccessToken(null);
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError('Failed to disconnect. Please try again.');
    }
  };

  console.log('[GSC Render] Rendering decision - isLoading:', isLoading, 'isConnecting:', isConnecting, 'selectedProject:', !!selectedProject);

  if (!selectedProject) {
    console.log('[GSC Render] Showing no project warning');
    return (
      <DashboardContent>
        <Alert severity="warning">
          Please select a project to configure Google Search Console integration.
        </Alert>
      </DashboardContent>
    );
  }

  if (isLoading || isConnecting) {
    console.log('[GSC Render] Showing loading spinner');
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 400 }}>
          <Iconify icon="svg-spinners:3-dots-fade" width={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {isConnecting ? 'Connecting to Google Search Console...' : 'Loading...'}
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  console.log('[GSC Render] Rendering main content - isConnected:', isConnected, 'properties:', properties.length);
  return (
    <DashboardContent>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Google Search Console
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure Google Search Console for {selectedProject.name}
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {debugLog.length > 0 && (
        <Card sx={{ mb: 3, bgcolor: 'grey.900', color: 'grey.100' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="subtitle2" sx={{ fontFamily: 'monospace' }}>
                Debug Log
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  navigator.clipboard.writeText(debugLog.join('\n'));
                }}
                sx={{ color: 'grey.300' }}
              >
                Copy
              </Button>
            </Stack>
            <Box
              sx={{
                maxHeight: 200,
                overflow: 'auto',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                bgcolor: 'grey.800',
                p: 2,
                borderRadius: 1,
              }}
            >
              {debugLog.map((log, index) => (
                <Box key={index} sx={{ mb: 0.5 }}>
                  {log}
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

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
                  Connect your Google account to access Search Console data for this project.
                </Typography>

                <Box sx={{ bgcolor: 'background.neutral', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    What you'll need:
                  </Typography>
                  <Typography variant="body2" component="div" color="text.secondary">
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>A Google account with access to Search Console</li>
                      <li>Permission to view the properties you want to track</li>
                      <li>OAuth 2.0 credentials configured in Google Cloud Console</li>
                    </ul>
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleConnect}
                    disabled={isConnecting}
                    startIcon={
                      isConnecting ? (
                        <Iconify icon="svg-spinners:3-dots-fade" />
                      ) : (
                        <Iconify icon="eva:link-2-fill" />
                      )
                    }
                  >
                    {isConnecting ? 'Connecting...' : 'Connect with Google'}
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

                {properties.length > 0 ? (
                  <>
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
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body2" color="text.secondary">
                              Project:
                            </Typography>
                            <Typography variant="body2">{selectedProject.name}</Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    No properties found. Make sure your Google account has access to Search Console properties.
                  </Alert>
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
                  {properties.length > 0 && (
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
                  )}
                </Stack>
              </>
            )}
          </Stack>
        </CardContent>
      </Card>
    </DashboardContent>
  );
}
