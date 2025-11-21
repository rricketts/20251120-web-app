const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const REDIRECT_URI = `${window.location.origin}/callback`;

export const GOOGLE_SCOPES = {
  SEARCH_CONSOLE_READONLY: 'https://www.googleapis.com/auth/webmasters.readonly',
};

export function generateAuthUrl(clientId: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_SCOPES.SEARCH_CONSOLE_READONLY,
    access_type: 'offline',
    prompt: 'consent',
    ...(state && { state }),
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function refreshAccessToken(
  refreshToken: string,
  supabaseUrl: string,
  accessToken: string
): Promise<string> {
  const response = await fetch(`${supabaseUrl}/functions/v1/google-oauth-refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

export async function fetchSearchConsoleSites(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Failed to fetch sites: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchSearchAnalytics(
  accessToken: string,
  siteUrl: string,
  startDate: string,
  endDate: string
) {
  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 10,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('TOKEN_EXPIRED');
    }
    throw new Error(`Failed to fetch analytics: ${response.statusText}`);
  }

  return response.json();
}
