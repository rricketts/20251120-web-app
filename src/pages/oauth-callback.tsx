import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { supabase } from 'src/lib/supabase';
import { exchangeCodeForTokens } from 'src/lib/googleAuth';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error' | 'success'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        let savedState = localStorage.getItem('oauth_state');
        console.log('Callback localStorage state:', savedState);
        console.log('URL state parameter:', state);

        if (!savedState && window.opener) {
          console.log('Requesting state from parent window...');
          savedState = await new Promise<string | null>((resolve) => {
            const handleMessage = (event: MessageEvent) => {
              console.log('Callback received message:', event.data);
              if (event.origin !== window.location.origin) {
                console.log('Origin mismatch:', event.origin, 'vs', window.location.origin);
                return;
              }
              if (event.data.type === 'oauth_state_response') {
                console.log('Received state from parent:', event.data.state);
                window.removeEventListener('message', handleMessage);
                resolve(event.data.state);
              }
            };

            window.addEventListener('message', handleMessage);
            window.opener.postMessage({ type: 'oauth_request_state' }, window.location.origin);

            setTimeout(() => {
              console.log('Timeout waiting for parent state');
              window.removeEventListener('message', handleMessage);
              resolve(null);
            }, 5000);
          });
        }

        console.log('Final saved state:', savedState);
        console.log('State match:', state === savedState);

        if (state !== savedState) {
          throw new Error(
            `Invalid state parameter - possible CSRF attack (expected: ${savedState}, got: ${state})`
          );
        }

        localStorage.removeItem('oauth_state');

        const clientId = localStorage.getItem('gsc_client_id');
        const clientSecret = localStorage.getItem('gsc_client_secret');

        if (!clientId || !clientSecret) {
          throw new Error('OAuth credentials not found. Please configure them first.');
        }

        const tokens = await exchangeCodeForTokens(code, clientId, clientSecret);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

        const { error: dbError } = await supabase.from('oauth_connections').upsert({
          user_id: user.id,
          provider: 'google_search_console',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt.toISOString(),
          scope: tokens.scope,
        });

        if (dbError) throw dbError;

        setStatus('success');

        if (window.opener) {
          window.opener.postMessage({ type: 'oauth_success' }, window.location.origin);
          setTimeout(() => window.close(), 1000);
        } else {
          setTimeout(() => navigate('/integrations/google-search-console'), 1500);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setErrorMessage(message);
        setStatus('error');
        console.error('OAuth callback error:', err);

        if (!window.opener) {
          setTimeout(() => navigate('/integrations/google-search-console'), 3000);
        }
      }
    };

    processCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        p: 3,
      }}
    >
      {status === 'processing' && (
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Box sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
            Processing authorization...
          </Box>
        </Box>
      )}

      {status === 'error' && (
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Box sx={{ fontWeight: 600, mb: 1 }}>Authorization Failed</Box>
          <Box sx={{ fontSize: '0.875rem' }}>{errorMessage}</Box>
          {!window.opener && (
            <Box sx={{ fontSize: '0.875rem', mt: 1, opacity: 0.8 }}>
              Redirecting back to integrations page...
            </Box>
          )}
        </Alert>
      )}

      {status === 'success' && (
        <Alert severity="success" sx={{ maxWidth: 600 }}>
          <Box sx={{ fontWeight: 600, mb: 1 }}>Successfully Connected!</Box>
          {window.opener ? (
            <Box sx={{ fontSize: '0.875rem' }}>This window will close automatically...</Box>
          ) : (
            <Box sx={{ fontSize: '0.875rem' }}>Redirecting to integrations page...</Box>
          )}
        </Alert>
      )}
    </Box>
  );
}
