import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { exchangeCodeForTokens } from '../lib/googleAuth';
import { supabase } from '../lib/supabase';

interface OAuthCallbackProps {
  clientId: string;
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function OAuthCallback({ clientId, clientSecret, onSuccess, onError }: OAuthCallbackProps) {
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
        console.log('Popup localStorage state:', savedState);
        console.log('URL state parameter:', state);

        if (!savedState && window.opener) {
          console.log('Requesting state from parent window...');
          savedState = await new Promise<string | null>((resolve) => {
            const handleMessage = (event: MessageEvent) => {
              console.log('Popup received message:', event.data);
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
          throw new Error(`Invalid state parameter - possible CSRF attack (expected: ${savedState}, got: ${state})`);
        }

        localStorage.removeItem('oauth_state');

        const tokens = await exchangeCodeForTokens(code, clientId, clientSecret);

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error('User not authenticated');
        }

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokens.expires_in);

        const { error: dbError } = await supabase
          .from('oauth_connections')
          .upsert({
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
          setTimeout(() => onSuccess(), 1000);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unknown error occurred';
        setErrorMessage(message);
        setStatus('error');
        onError(message);
      }
    };

    processCallback();
  }, [clientId, clientSecret, onSuccess, onError]);

  if (status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-gray-600">Processing authorization...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 bg-red-50 rounded-lg">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="text-red-800 font-medium">Authorization Failed</p>
        <p className="text-red-600 text-sm text-center max-w-md">{errorMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 bg-green-50 rounded-lg">
      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-green-800 font-medium">Successfully connected!</p>
      {window.opener && <p className="text-green-600 text-sm">This window will close automatically...</p>}
    </div>
  );
}
