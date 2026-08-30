import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import { useAutomationStore } from '../store/automationStore';
import toast from 'react-hot-toast';
import { Play, Loader2, Briefcase, Cpu, AlertTriangle, CheckCircle2 } from 'lucide-react';

import PlatformCard from '../components/PlatformCard';
import TagInput from '../components/TagInput';
import ToggleSwitch from '../components/ToggleSwitch';
import StatPill from '../components/StatPill';
import RunLogRow from '../components/RunLogRow';

export default function ControlPanel() {
  const { user, fetchUser, updateUser } = useAuthStore();
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

  // Simulation States
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [allSimEvents, setAllSimEvents] = useState([]);
  const [currentSimLogIndex, setCurrentSimLogIndex] = useState(0);
  const [simBrowserUrl, setSimBrowserUrl] = useState('about:blank');
  const [simBrowserState, setSimBrowserState] = useState('idle'); // idle, linkedin_login, naukri_login, searching, job_details, easy_apply, success, skipped, failed, complete
  const [simActivePlatform, setSimActivePlatform] = useState('');
  const [simActiveJobTitle, setSimActiveJobTitle] = useState('');
  const [simActiveCompany, setSimActiveCompany] = useState('');
  const [simActiveLocation, setSimActiveLocation] = useState('');

  const terminalLogRef = useRef(null);

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

  const handleDisconnectLinkedIn = async () => {
    try {
      const res = await api.delete('/api/auth/linkedin');
      updateUser(res.data);
      toast.success('LinkedIn account disconnected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to disconnect LinkedIn');
    }
  };

  const handleDisconnectNaukri = async () => {
    try {
      const res = await api.delete('/api/auth/naukri');
      updateUser(res.data);
      toast.success('Naukri account disconnected');
    } catch (err) {
      console.error(err);
      toast.error('Failed to disconnect Naukri');
    }
  };

  const handleStartSimulation = async () => {
    setSimulationActive(true);
    setSimulationLogs([]);
    setAllSimEvents([]);
    setCurrentSimLogIndex(0);
    setSimBrowserUrl('about:blank');
    setSimBrowserState('idle');
    
    try {
      const res = await api.post('/api/automations/simulate-run');
      if (res.data && res.data.success) {
        setAllSimEvents(res.data.events);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start simulation');
      setSimulationActive(false);
    }
  };

  // Playback loop for simulation events
  useEffect(() => {
    if (!simulationActive || allSimEvents.length === 0 || currentSimLogIndex >= allSimEvents.length) {
      if (simulationActive && allSimEvents.length > 0 && currentSimLogIndex === allSimEvents.length) {
        setSimBrowserState('complete');
        // Refresh recent runs
        api.get('/api/applications?limit=10&sort=newest').then(res => {
          setRecentRuns(res.data.applications || []);
        }).catch(() => null);
        // Refresh config / status
        api.get('/api/automations/config').then(res => {
          if (res.data) {
             setConfig(res.data);
             if (res.data.lastRunResult) {
                setLastResult(res.data.lastRunResult);
             }
          }
        }).catch(() => null);
      }
      return;
    }

    const timer = setTimeout(() => {
      const currentEvent = allSimEvents[currentSimLogIndex];
      setSimulationLogs(prev => [...prev, currentEvent]);
      
      const msg = currentEvent.message.toLowerCase();
      
      if (msg.includes('initializing') || msg.includes('chrome')) {
        setSimBrowserUrl('about:blank');
        setSimBrowserState('idle');
      } else if (msg.includes('linkedin login') || msg.includes('linkedin portal')) {
        setSimBrowserUrl('https://www.linkedin.com/login');
        setSimActivePlatform('linkedin');
        setSimBrowserState('linkedin_login');
      } else if (msg.includes('naukri login') || msg.includes('naukri portal')) {
        setSimBrowserUrl('https://www.naukri.com/nlogin/login');
        setSimActivePlatform('naukri');
        setSimBrowserState('naukri_login');
      } else if (msg.includes('searching jobs')) {
        const platformDomain = simActivePlatform === 'linkedin' ? 'linkedin.com' : 'naukri.com';
        setSimBrowserUrl(`https://www.${platformDomain}/jobs/search`);
        setSimBrowserState('searching');
      } else if (msg.includes('found matching job listing')) {
        const match = currentEvent.message.match(/Found matching job listing: "(.*?)" at (.*)/i);
        if (match) {
          setSimActiveJobTitle(match[1]);
          setSimActiveCompany(match[2]);
        }
        setSimBrowserState('job_details');
      } else if (msg.includes('clicking easy apply') || msg.includes('answering questionnaire')) {
        setSimBrowserState('easy_apply');
      } else if (msg.includes('submitted successfully')) {
        setSimBrowserState('success');
      } else if (msg.includes('skipping')) {
        setSimBrowserState('skipped');
      } else if (msg.includes('failed')) {
        setSimBrowserState('failed');
      }

      setCurrentSimLogIndex(prev => prev + 1);

      if (terminalLogRef.current) {
        terminalLogRef.current.scrollTop = terminalLogRef.current.scrollHeight;
      }
    }, 700 + Math.random() * 500);

    return () => clearTimeout(timer);
  }, [simulationActive, allSimEvents, currentSimLogIndex]);

  const renderBrowserPreview = () => {
    switch (simBrowserState) {
      case 'idle':
        return (
          <div className="text-center text-gray-500 animate-pulse">
            <Loader2 size={36} className="animate-spin mx-auto mb-2 text-gray-600" />
            <p className="text-xs">Initializing Chromium Browser...</p>
          </div>
        );
      case 'linkedin_login':
        return (
          <div className="w-full max-w-xs bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-center h-full max-h-56">
            <h3 className="text-xs font-bold text-[#0A66C2] mb-3 text-center">LinkedIn Login</h3>
            <div className="space-y-2.5">
              <div className="h-6 bg-gray-800 rounded px-2 flex items-center text-[10px] text-gray-400 truncate">
                {user?.linkedinEmail || 'username@linkedin.com'}
              </div>
              <div className="h-6 bg-gray-800 rounded px-2 flex items-center text-[10px] text-gray-400">
                ••••••••••••
              </div>
              <div className="h-6 bg-[#0A66C2] text-white rounded text-[10px] font-bold flex items-center justify-center animate-pulse">
                Signing in...
              </div>
            </div>
          </div>
        );
      case 'naukri_login':
        return (
          <div className="w-full max-w-xs bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-center h-full max-h-56">
            <h3 className="text-xs font-bold text-[#FF7A59] mb-3 text-center">Naukri Login</h3>
            <div className="space-y-2.5">
              <div className="h-6 bg-gray-800 rounded px-2 flex items-center text-[10px] text-gray-400 truncate">
                {user?.naukriEmail || 'username@naukri.com'}
              </div>
              <div className="h-6 bg-gray-800 rounded px-2 flex items-center text-[10px] text-gray-400">
                ••••••••••••
              </div>
              <div className="h-6 bg-[#FF7A59] text-white rounded text-[10px] font-bold flex items-center justify-center animate-pulse">
                Signing in...
              </div>
            </div>
          </div>
        );
      case 'searching':
        return (
          <div className="text-center text-gray-400 space-y-2">
            <Briefcase size={32} className="mx-auto text-[#185FA5] animate-bounce" />
            <p className="text-xs font-semibold">Searching jobs...</p>
            <p className="text-[10px] text-gray-500 italic">Querying keywords matching target skills...</p>
          </div>
        );
      case 'job_details':
        return (
          <div className="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col justify-between h-full max-h-56">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-semibold bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">
                  {simActivePlatform === 'linkedin' ? 'LinkedIn Easy Apply' : 'Naukri Direct Apply'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-gray-200 mt-2 truncate">{simActiveJobTitle}</h3>
              <p className="text-xs text-gray-400 truncate">{simActiveCompany}</p>
            </div>
            
            <div className="border-t border-gray-800 pt-3 mt-3 flex items-center justify-between">
              <span className="text-[10px] text-gray-500">Matching details...</span>
              <button disabled className="px-3 py-1 bg-[#185FA5] text-white text-[10px] rounded font-bold animate-pulse">
                Analyzing Job
              </button>
            </div>
          </div>
        );
      case 'easy_apply':
        return (
          <div className="w-full max-w-sm bg-gray-900 border border-[#185FA5] rounded-lg p-4 flex flex-col justify-between h-full max-h-56">
            <div>
              <h3 className="text-sm font-bold text-gray-200 truncate">{simActiveJobTitle}</h3>
              <p className="text-xs text-gray-400 truncate">{simActiveCompany}</p>
              
              <div className="mt-3 space-y-1.5 text-[9px] text-gray-400">
                <div className="flex items-center gap-1.5 text-green-400"><CheckCircle2 size={10} /> Resume matched and uploaded</div>
                <div className="flex items-center gap-1.5"><Loader2 size={10} className="animate-spin text-blue-400" /> Autofilling application form...</div>
              </div>
            </div>
            
            <div className="border-t border-gray-800 pt-3 mt-3 flex items-center justify-between">
              <span className="text-[10px] text-[#185FA5] font-semibold">Autofilling questionnaire...</span>
              <button disabled className="px-3 py-1 bg-green-600 text-white text-[10px] rounded font-bold animate-pulse">
                Submitting Form
              </button>
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-950/30 text-green-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="text-sm font-bold text-green-400">Application Submitted!</h4>
            <p className="text-xs text-gray-300 max-w-xs truncate">{simActiveJobTitle}</p>
            <p className="text-[10px] text-gray-500 truncate">{simActiveCompany}</p>
          </div>
        );
      case 'skipped':
        return (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-950/30 text-amber-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h4 className="text-sm font-bold text-amber-400">Listing Skipped</h4>
            <p className="text-xs text-gray-400 max-w-xs truncate">{simActiveJobTitle} @ {simActiveCompany}</p>
            <p className="text-[10px] text-gray-500 font-semibold">Reason: Already applied or requirements mismatch</p>
          </div>
        );
      case 'failed':
        return (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-red-950/30 text-red-400 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={28} className="text-red-500" />
            </div>
            <h4 className="text-sm font-bold text-red-500">Application Failed</h4>
            <p className="text-xs text-gray-400 max-w-xs truncate">{simActiveJobTitle} @ {simActiveCompany}</p>
            <p className="text-[10px] text-gray-500">Reason: Selector timeout</p>
          </div>
        );
      case 'complete':
        return (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-950/30 text-blue-450 rounded-full flex items-center justify-center mx-auto">
              <Cpu size={28} className="text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-blue-405 text-blue-400">Simulation Finished</h4>
            <p className="text-xs text-gray-300 max-w-xs">All simulated applications saved to history database.</p>
            <button 
              onClick={() => setSimulationActive(false)}
              className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-[10px] rounded font-bold hover:bg-blue-700 transition-colors"
            >
              Close Simulator
            </button>
          </div>
        );
      default:
        return null;
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
            connectUrl="/profile"
            onDisconnect={handleDisconnectLinkedIn}
          >
            <svg className="text-[#0A66C2] w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
            </svg>
          </PlatformCard>
 
          <PlatformCard
            platformName="Naukri"
            description="Used for automated job applications"
            isConnected={isNaukriConnected}
            connectUrl="/profile"
            onDisconnect={handleDisconnectNaukri}
          >
            <Briefcase className="text-[#FF7A59]" size={24} />
          </PlatformCard>
          
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
            Credentials are encrypted natively before DB save and never shared.
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
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex-1">
             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Override & Showcase Simulator</h2>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Force start the real bot in the background or run our interactive real-time scraper simulator for showcase purposes.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
            <button
              onClick={handleRunNow}
              disabled={isRunning || simulationActive || !canRun}
              title={!canRun ? "Connect at least one platform and add skills to run" : ""}
              className="px-5 py-2.5 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" />
                  Run Real Bot
                </>
              )}
            </button>

            <button
              onClick={handleStartSimulation}
              disabled={isRunning || simulationActive}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Cpu size={16} />
              Launch Showcase Simulator
            </button>
          </div>
        </div>

        {/* Live Simulator View */}
        {simulationActive && (
          <div className="p-6 bg-gray-900 border-b border-gray-700 text-white grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Terminal Panel */}
            <div className="flex flex-col h-72">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg">
                <span className="font-mono text-[10px] text-gray-400 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  launchpad_scraper_terminal.sh
                </span>
                <span className="text-[9px] text-gray-500">UTF-8</span>
              </div>
              <div 
                ref={terminalLogRef}
                className="flex-1 bg-black font-mono text-[10px] text-green-400 p-4 rounded-b-lg overflow-y-auto space-y-1.5 shadow-inner"
              >
                {simulationLogs.map((log, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="text-gray-500 shrink-0">[{new Date().toLocaleTimeString()}]</span>
                    <span className={
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warn' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-green-300 font-semibold' : 'text-green-400'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
                {currentSimLogIndex < allSimEvents.length && (
                  <div className="flex items-center gap-1.5 text-green-500 animate-pulse mt-1">
                    <span>$</span>
                    <span className="w-1.5 h-3 bg-green-500 inline-block"></span>
                  </div>
                )}
              </div>
            </div>

            {/* Virtual Browser Preview Panel */}
            <div className="flex flex-col h-72">
              <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700 rounded-t-lg gap-2 text-xs">
                {/* Traffic lights */}
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                {/* Browser address bar */}
                <div className="flex-1 bg-gray-950 text-gray-400 px-3 py-0.5 rounded border border-gray-700 text-[9px] font-mono select-none truncate">
                  {simBrowserUrl}
                </div>
              </div>
              <div className="flex-1 bg-gray-950 rounded-b-lg border border-gray-800 p-4 flex flex-col justify-center items-center relative overflow-hidden select-none">
                {renderBrowserPreview()}
              </div>
            </div>
          </div>
        )}
        
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
