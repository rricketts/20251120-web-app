import { useState, useEffect } from 'react';
import { Search, TrendingUp, MousePointerClick, Eye, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase, type OAuthConnection } from '../lib/supabase';
import { fetchSearchConsoleSites, fetchSearchAnalytics, refreshAccessToken } from '../lib/googleAuth';

interface SearchConsoleDashboardProps {
  clientId: string;
  clientSecret: string;
  onDisconnect: () => void;
}

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

export function SearchConsoleDashboard({ clientId, clientSecret, onDisconnect }: SearchConsoleDashboardProps) {
  const [connection, setConnection] = useState<OAuthConnection | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [analytics, setAnalytics] = useState<AnalyticsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadConnection();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error: fetchError } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('provider', 'google_search_console')
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) throw new Error('No connection found');

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
      const newAccessToken = await refreshAccessToken(
        connection.refresh_token,
        clientId,
        clientSecret
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

  const handleDisconnect = async () => {
    if (!connection) return;

    try {
      const { error: deleteError } = await supabase
        .from('oauth_connections')
        .delete()
        .eq('id', connection.id);

      if (deleteError) throw deleteError;

      onDisconnect();
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
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="w-full max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Search Console Dashboard</h1>
          <p className="text-gray-600 mt-1">View your Google Search Console analytics</p>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          Disconnect
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {sites.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Property
          </label>
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sites.map((site) => (
              <option key={site.siteUrl} value={site.siteUrl}>
                {site.siteUrl}
              </option>
            ))}
          </select>
        </div>
      )}

      {analytics.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MousePointerClick className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Total Clicks</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totals.clicks.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Total Impressions</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totals.impressions.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Avg. CTR</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {((totals.avgCtr / analytics.length) * 100).toFixed(2)}%
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Search className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-600 text-sm font-medium">Avg. Position</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {(totals.avgPosition / analytics.length).toFixed(1)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Top Queries (Last 28 Days)</h2>
              <button
                onClick={loadAnalytics}
                disabled={refreshing}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Query
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clicks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Impressions
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CTR
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {analytics.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{row.keys[0]}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">{row.clicks}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {row.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {(row.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        {row.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {sites.length === 0 && !error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No properties found in your Search Console account.</p>
        </div>
      )}
    </div>
  );
}
