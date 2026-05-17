import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAutomationStore } from '../store/automationStore';
import toast from 'react-hot-toast';
import { Play, Loader2, Briefcase } from 'lucide-react';

import PlatformCard from '../components/PlatformCard';
import TagInput from '../components/TagInput';
import ToggleSwitch from '../components/ToggleSwitch';
import StatPill from '../components/StatPill';
import RunLogRow from '../components/RunLogRow';

export default function ControlPanel() {
  const { user, fetchUser } = useAuthStore();
  const { config, setConfig, isRunning, setRunning, lastResult, setLastResult } = useAutomationStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Form State
  const [skills, setSkills] = useState([]);
  const [location, setLocation] = useState('');
  const [maxJobs, setMaxJobs] = useState(15);
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [active, setActive] = useState(false);

  // Live log state
  const [recentRuns, setRecentRuns] = useState([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);

  // Fetch initial config
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.get('/api/automations/config');
        if (res.data) {
          setConfig(res.data);
          setSkills(res.data.skills || []);
          setLocation(res.data.location || '');
          setMaxJobs(res.data.maxJobsPerDay || 15);
          setScheduleTime(res.data.scheduledTime || '09:00');
          setActive(res.data.active || false);
          if (res.data.lastRunResult) {
            setLastResult(res.data.lastRunResult);
          }
        }
      } catch (err) {
        toast.error('Failed to load automation configuration');
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, [setConfig, setLastResult]);

  // Check for unsaved changes
  useEffect(() => {
    if (!config) {
      if (skills.length > 0 || location || maxJobs !== 15 || scheduleTime !== '09:00' || active) {
        setHasUnsavedChanges(true);
      } else {
        setHasUnsavedChanges(false);
      }
      return;
    }

    const isChanged = 
      JSON.stringify(skills) !== JSON.stringify(config.skills) ||
      location !== config.location ||
      maxJobs !== config.maxJobsPerDay ||
      scheduleTime !== config.scheduledTime ||
      active !== config.active;

    setHasUnsavedChanges(isChanged);
  }, [skills, location, maxJobs, scheduleTime, active, config]);

  // Fetch live logs
  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get('/api/applications?limit=10&sort=newest');
        setRecentRuns(res.data.applications || []);
      } catch (err) {
        // Silent fail for logs
      } finally {
        setIsLoadingRuns(false);
      }
    }

    loadLogs();
    
    // Auto-refresh every 30s
    const intervalId = setInterval(loadLogs, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (skills.length === 0) {
         toast.error('Please add at least one skill.');
         return;
      }

      const res = await api.post('/api/automations/config', {
        skills,
        location,
        maxJobsPerDay: maxJobs,
        scheduledTime: scheduleTime,
        active
      });
      
      setConfig(res.data);
      setHasUnsavedChanges(false);
      toast.success('Configuration saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunNow = async () => {
    setRunning(true);
    toast.success('Bot started! Results will appear below as they come in');
    try {
      await api.post('/api/automations/run');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start bot');
      setRunning(false);
    }
  };

  const isLinkedInConnected = user?.linkedinConnected;
  const isNaukriConnected = user?.naukriConnected;
  const canRun = skills.length > 0 && (isLinkedInConnected || isNaukriConnected);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 animate-pulse"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
        <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Control Panel</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage connected platforms and tune your automation bot.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <span className="text-sm font-medium text-amber-600 dark:text-amber-500">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-[#185FA5] hover:bg-[#15508a] text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#185FA5] dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Save configuration
          </button>
        </div>
      </div>

      {/* SECTION 1: Connected Accounts */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Connected Accounts</h2>
        </div>
        <div className="p-6 space-y-4">
          <PlatformCard
            platformName="LinkedIn"
            description="Used for Easy Apply automation"
            isConnected={isLinkedInConnected}
            connectUrl="/api/auth/linkedin"
            onDisconnect={() => toast.success('Disconnect functionality coming soon')}
          >
            <svg className="text-[#0A66C2] w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </PlatformCard>

          <PlatformCard
            platformName="Naukri"
            description="Used for automated job applications"
            isConnected={isNaukriConnected}
            connectUrl="/api/auth/naukri"
            onDisconnect={() => toast.success('Disconnect functionality coming soon')}
          >
            <Briefcase className="text-[#FF7A59]" size={24} />
          </PlatformCard>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Your credentials are never stored — we use OAuth tokens only.
          </p>
        </div>
      </section>

      {/* SECTION 2: Automation Config */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Automation Rules</h2>
          <ToggleSwitch 
            checked={active} 
            onChange={setActive} 
            tooltip="Turn on to enable daily auto-apply" 
            label="Automation active" 
          />
        </div>
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Skills</label>
              <TagInput 
                tags={skills} 
                setTags={setSkills} 
                placeholder="e.g. React, Node.js, Python" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Location</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                placeholder="e.g. Bangalore, Remote, Mumbai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max jobs per day</label>
                <span className="text-sm font-bold text-[#185FA5] dark:text-[#60A5FA] bg-[#E6F1FB] dark:bg-[#185FA5]/20 px-2 py-0.5 rounded">
                  {maxJobs} jobs/day
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-[#185FA5]"
                value={maxJobs}
                onChange={(e) => setMaxJobs(parseInt(e.target.value))}
              />
              {maxJobs > 30 && (
                <p className="text-xs font-medium text-amber-600 dark:text-amber-500 mt-1">
                  High volume may trigger platform rate limits
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Run automation daily at</label>
              <input
                type="time"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
              />
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3: Run Now + Live Log */}
      <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Override</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Force start the automation bot immediately.</p>
          </div>
          
          <button
            onClick={handleRunNow}
            disabled={isRunning || !canRun}
            title={!canRun ? "Connect at least one platform and add skills to run" : ""}
            className="w-full md:w-auto px-8 py-3 bg-[#185FA5] hover:bg-[#15508a] text-white font-bold rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#185FA5] dark:focus:ring-offset-gray-900 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Run automation now
              </>
            )}
          </button>
        </div>
        
        {lastResult && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Last Run Summary</h3>
            <div className="flex flex-wrap gap-3">
              <StatPill icon="✅" label="Success" count={lastResult.success} colorClass="text-green-600" />
              <StatPill icon="❌" label="Failed" count={lastResult.failed} colorClass="text-red-600" />
              <StatPill icon="⏭" label="Skipped" count={lastResult.skipped} colorClass="text-gray-500" />
            </div>
            {config?.lastRunAt && (
              <p className="text-xs text-gray-500 mt-3">
                Last run completed {new Date(config.lastRunAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="p-0">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent run activity</h3>
            {isRunning && <span className="flex items-center gap-2 text-xs font-medium text-[#185FA5] dark:text-[#60A5FA]"><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#185FA5] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#185FA5]"></span></span>Live updating...</span>}
          </div>
          
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {isLoadingRuns ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-gray-400" size={24} />
              </div>
            ) : recentRuns.length > 0 ? (
              recentRuns.map(app => <RunLogRow key={app._id} application={app} />)
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5s3.19.5 5.5-1.5c-2-.5-2.5-3-3-4z" />
                  <path d="M12 15l-3-3m3 3l3-3m-3 3v-6" />
                  <path d="M9 12l2 2 4-4M19 5c1.5-1.5 3-1 3-1s.5 1.5-1 3c-2.39 2.39-5.32 3.86-8.52 4.14l-1.62-1.62C11.14 6.32 12.61 3.39 15 1z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No runs yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">When your bot starts running, application attempts will appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
    </div>
  );
}
