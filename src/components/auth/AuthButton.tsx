import { useState, useEffect } from 'react';
import { LogIn } from 'lucide-react';
import { generateAuthUrl } from '../lib/googleAuth';

interface AuthButtonProps {
  clientId: string;
  onAuthStart?: () => void;
}

export function AuthButton({ clientId, onAuthStart }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('Parent received message:', event.data);
      if (event.origin !== window.location.origin) {
        console.log('Parent: origin mismatch', event.origin, 'vs', window.location.origin);
        return;
      }

      if (event.data.type === 'oauth_request_state') {
        const savedState = localStorage.getItem('oauth_state');
        console.log('Parent sending state to popup:', savedState);
        event.source?.postMessage(
          { type: 'oauth_state_response', state: savedState },
          { targetOrigin: window.location.origin }
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = () => {
    setIsLoading(true);
    onAuthStart?.();

    const state = crypto.randomUUID();
    localStorage.setItem('oauth_state', state);
    console.log('Parent stored state:', state);

    const authUrl = generateAuthUrl(clientId, state);
    window.open(authUrl, '_blank', 'width=600,height=700');
    setIsLoading(false);
  };

  return (
    <button
      onClick={handleConnect}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors shadow-sm"
    >
      <LogIn className="w-5 h-5" />
      {isLoading ? 'Connecting...' : 'Connect Google Search Console'}
    </button>
  );
}
