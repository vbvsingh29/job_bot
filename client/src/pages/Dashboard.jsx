import React, { useEffect, useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import PlatformBadge from '../components/PlatformBadge';
import StatusBadge from '../components/StatusBadge';

// Simple relative time formatter
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays === 1) return 'Yesterday';
  return `${diffInDays}d ago`;
};

const SkeletonCard = () => (
  <div className="p-6 bg-bg-body border border-border-default rounded-card shadow-sm animate-pulse">
    <div className="w-24 h-4 mb-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
  </div>
);

export const Dashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [runningBot, setRunningBot] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, appsRes] = await Promise.all([
          api.get('/api/stats'),
          api.get('/api/applications?page=1&limit=5')
        ]);
        setStats(statsRes.data);
        setApplications(appsRes.data.applications);
      } catch (err) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoadingStats(false);
        setLoadingApps(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleRunBot = async () => {
    setRunningBot(true);
    try {
      await api.post('/api/automations/run');
      toast.success("Bot started! You'll be notified when it finishes.");
    } catch (err) {
      toast.error('Failed to start bot. Make sure accounts are connected.');
    } finally {
      setRunningBot(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Welcome back, {user?.name?.split(' ')[0]}!</h2>
          <p className="text-text-secondary mt-1">Here's what's happening with your job search today.</p>
        </div>
        <button
          onClick={handleRunBot}
          disabled={runningBot}
          className="flex items-center px-4 py-2 font-medium text-white transition-colors rounded-md bg-primary hover:bg-primary-dark disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <Play className="w-4 h-4 mr-2" />
          {runningBot ? 'Starting...' : "Run today's bot"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loadingStats ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <div className="p-6 bg-bg-body border border-border-default rounded-card shadow-sm">
              <h3 className="text-sm font-medium text-text-secondary">Applied Today</h3>
              <p className="mt-2 text-3xl font-bold text-text-primary">{stats?.today || 0}</p>
            </div>
            <div className="p-6 bg-bg-body border border-border-default rounded-card shadow-sm">
              <h3 className="text-sm font-medium text-text-secondary">This Week</h3>
              <p className="mt-2 text-3xl font-bold text-text-primary">{stats?.week || 0}</p>
            </div>
            <div className="p-6 bg-bg-body border border-border-default rounded-card shadow-sm">
              <h3 className="text-sm font-medium text-text-secondary">Success Rate</h3>
              <p className="mt-2 text-3xl font-bold text-success">{stats?.successRate || 0}%</p>
            </div>
            <div className="p-6 bg-bg-body border border-border-default rounded-card shadow-sm">
              <h3 className="text-sm font-medium text-text-secondary">Total Failed</h3>
              <p className="mt-2 text-3xl font-bold text-danger">{stats?.failed || 0}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Applications Table */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Recent Applications</h3>
          <div className="bg-bg-body border border-border-default rounded-card shadow-sm overflow-hidden">
            {loadingApps ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <h4 className="text-lg font-medium text-text-primary">No applications yet</h4>
                <p className="mt-1 text-sm text-text-secondary">Run the bot to start applying to jobs automatically.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-text-secondary">
                  <thead className="text-xs uppercase bg-surface border-b border-border-default text-text-secondary">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Job Title & Company</th>
                      <th className="px-6 py-3 font-semibold">Platform</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                      <th className="px-6 py-3 font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app._id} className="border-b border-border-default last:border-0 hover:bg-surface">
                        <td className="px-6 py-4">
                          <p className="font-medium text-text-primary">{app.jobTitle}</p>
                          <p className="text-xs">{app.company}</p>
                        </td>
                        <td className="px-6 py-4">
                          <PlatformBadge platform={app.platform} />
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getRelativeTime(app.appliedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Connected Accounts */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Connected Accounts</h3>
          <div className="bg-bg-body border border-border-default rounded-card shadow-sm p-6 space-y-4">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <LinkIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-primary">LinkedIn</p>
                  <p className="text-xs text-text-secondary">
                    {user?.linkedinConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {user?.linkedinConnected ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <button className="text-sm font-medium text-primary hover:underline">Connect</button>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <LinkIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-text-primary">Naukri</p>
                  <p className="text-xs text-text-secondary">
                    {user?.naukriConnected ? 'Connected' : 'Not connected'}
                  </p>
                </div>
              </div>
              {user?.naukriConnected ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : (
                <button className="text-sm font-medium text-primary hover:underline">Connect</button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
