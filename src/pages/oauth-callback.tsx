import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

import { supabase } from 'src/lib/supabase';

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

        let savedState: string | null = null;

        if (window.opener) {
          console.log('Popup mode: Requesting state from parent window...');
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

            setTimeout(() => {
              window.opener.postMessage({ type: 'oauth_request_state' }, window.location.origin);
            }, 100);

            setTimeout(() => {
              console.log('Timeout waiting for parent state');
              window.removeEventListener('message', handleMessage);
              resolve(null);
            }, 5000);
          });
        } else {
          console.log('Direct navigation mode: Using localStorage');
          savedState = localStorage.getItem('oauth_state');
          localStorage.removeItem('oauth_state');
        }

        console.log('Final saved state:', savedState);
        console.log('URL state parameter:', state);
        console.log('State match:', state === savedState);

        if (!savedState || state !== savedState) {
          throw new Error(
            `Invalid state parameter - possible CSRF attack (expected: ${savedState}, got: ${state})`
          );
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('User not authenticated');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-oauth-exchange`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirectUri: `${window.location.origin}/callback`,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to exchange authorization code');
        }

        const tokens = await response.json();

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
