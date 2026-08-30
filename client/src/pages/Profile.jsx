import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import TagInput from '../components/TagInput';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Upload, 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  Lock, 
  Clock, 
  LogOut,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Profile() {
  const { user, token, updateUser, logout } = useAuthStore();
  const fileInputRef = useRef(null);

  // Profile Form States
  const [profileName, setProfileName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [targetRoles, setTargetRoles] = useState([]);
  const [skills, setSkills] = useState([]);
  
  // Base State for Change Checking
  const [baseState, setBaseState] = useState(null);

  // Resume Upload States
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Connected Accounts States
  const [naukriEmail, setNaukriEmail] = useState('');
  const [naukriPassword, setNaukriPassword] = useState('');
  const [showNaukriForm, setShowNaukriForm] = useState(false);
  const [isNaukriLoading, setIsNaukriLoading] = useState(false);
  const [linkedinEmail, setLinkedinEmail] = useState('');
  const [linkedinPassword, setLinkedinPassword] = useState('');
  const [showLinkedinForm, setShowLinkedinForm] = useState(false);
  const [isLinkedinLoading, setIsLinkedinLoading] = useState(false);
  const [confirmDisconnectLinkedIn, setConfirmDisconnectLinkedIn] = useState(false);
  const [confirmDisconnectNaukri, setConfirmDisconnectNaukri] = useState(false);

  // Preferences States
  const [scheduledReportTime, setScheduledReportTime] = useState('21:00');
  const [reportEmail, setReportEmail] = useState('');
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  // Danger Zone States
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Notification Toast States
  const [toast, setToast] = useState(null);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch /api/auth/me to populate fields and get latest data
  const fetchUserData = async () => {
    try {
      const res = await api.get('/api/auth/me');
      const data = res.data;
      
      // Update store user state
      updateUser(data);

      // Populate local states
      setProfileName(data.name || '');
      setPhone(data.phone || '');
      setLocation(data.location || '');
      setExperience(data.experience || '');
      setTargetRoles(data.targetRoles || []);
      setSkills(data.skills || []);

      // Keep a base record to evaluate unsaved changes
      setBaseState({
        name: data.name || '',
        phone: data.phone || '',
        location: data.location || '',
        experience: data.experience || '',
        targetRoles: data.targetRoles || [],
        skills: data.skills || []
      });
    } catch (err) {
      console.error('Failed to load profile data:', err);
      triggerToast('Failed to load profile information', 'error');
    }
  };

  // Fetch report preferences config
  const fetchConfigData = async () => {
    try {
      const res = await api.get('/api/automations/config');
      if (res.data) {
        setScheduledReportTime(res.data.scheduledReportTime || '21:00');
        setReportEmail(res.data.reportEmail || user?.email || '');
      } else {
        setReportEmail(user?.email || '');
      }
    } catch (err) {
      console.error('Failed to load automation config:', err);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchConfigData();

    // Check query params for OAuth return signals
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'linkedin') {
      triggerToast('LinkedIn connected successfully!', 'success');
      // Clean query parameters from URL history bar
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('error') === 'linkedin_failed') {
      triggerToast('LinkedIn connection failed. Please try again.', 'error');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Sync reportEmail if user object updates
  useEffect(() => {
    if (user && !reportEmail) {
      setReportEmail(user.email);
    }
  }, [user]);

  // Unsaved Changes Calculation
  const hasUnsavedChanges = () => {
    if (!baseState) return false;
    
    // Helper to compare flat arrays
    const arraysEqual = (a, b) => {
      if (a.length !== b.length) return false;
      const sortedA = [...a].sort();
      const sortedB = [...b].sort();
      return sortedA.every((val, index) => val === sortedB[index]);
    };

    return (
      profileName !== baseState.name ||
      phone !== baseState.phone ||
      location !== baseState.location ||
      experience !== baseState.experience ||
      !arraysEqual(targetRoles, baseState.targetRoles) ||
      !arraysEqual(skills, baseState.skills)
    );
  };

  // Discard Unsaved Changes
  const handleDiscardChanges = () => {
    if (!baseState) return;
    setProfileName(baseState.name);
    setPhone(baseState.phone);
    setLocation(baseState.location);
    setExperience(baseState.experience);
    setTargetRoles(baseState.targetRoles);
    setSkills(baseState.skills);
    triggerToast('Changes discarded', 'info');
  };

  // Save Card 1 - Profile Details
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    try {
      const res = await api.put('/api/profile', {
        name: profileName,
        phone,
        location,
        experience,
        targetRoles,
        skills
      });
      
      updateUser(res.data);
      setBaseState({
        name: res.data.name || '',
        phone: res.data.phone || '',
        location: res.data.location || '',
        experience: res.data.experience || '',
        targetRoles: res.data.targetRoles || [],
        skills: res.data.skills || []
      });

      triggerToast('Profile updated!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast(err.response?.data?.message || 'Failed to save changes', 'error');
    }
  };

  // Card 2 - File Drag & Drop Handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  // Axios Upload Request
  const uploadFile = async (file) => {
    // Validate PDF mimetype
    if (file.type !== 'application/pdf') {
      return triggerToast('Only PDF files are allowed!', 'error');
    }
    // Validate Max size 5MB
    if (file.size > 5 * 1024 * 1024) {
      return triggerToast('File is too large! Maximum limit is 5MB.', 'error');
    }

    const formData = new FormData();
    formData.append('resume', file);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const res = await api.post('/api/profile/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      updateUser({ resumeUrl: res.data.resumeUrl });
      triggerToast('Resume uploaded successfully!', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      triggerToast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // LinkedIn Disconnect
  const handleDisconnectLinkedIn = async () => {
    try {
      const res = await api.delete('/api/auth/linkedin');
      updateUser(res.data);
      setConfirmDisconnectLinkedIn(false);
      triggerToast('LinkedIn account disconnected', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to disconnect LinkedIn', 'error');
    }
  };

  // Naukri Disconnect
  const handleDisconnectNaukri = async () => {
    try {
      const res = await api.delete('/api/auth/naukri');
      updateUser(res.data);
      setConfirmDisconnectNaukri(false);
      triggerToast('Naukri account disconnected', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to disconnect Naukri', 'error');
    }
  };

  // Naukri Local Credentials Save
  const handleSaveNaukri = async (e) => {
    e.preventDefault();
    if (!naukriEmail || !naukriPassword) {
      return triggerToast('Please enter both email and password', 'error');
    }

    setIsNaukriLoading(true);
    try {
      await api.post('/api/auth/naukri/connect', {
        email: naukriEmail,
        password: naukriPassword
      });

      // Refetch me to get connected flag
      const meRes = await api.get('/api/auth/me');
      updateUser(meRes.data);

      setShowNaukriForm(false);
      setNaukriEmail('');
      setNaukriPassword('');
      triggerToast('Naukri credentials connected successfully!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to connect Naukri credentials', 'error');
    } finally {
      setIsNaukriLoading(false);
    }
  };

  // LinkedIn Local Credentials Save
  const handleSaveLinkedin = async (e) => {
    e.preventDefault();
    if (!linkedinEmail || !linkedinPassword) {
      return triggerToast('Please enter both email and password', 'error');
    }

    setIsLinkedinLoading(true);
    try {
      await api.post('/api/auth/linkedin/connect', {
        email: linkedinEmail,
        password: linkedinPassword
      });

      // Refetch me to get connected flag
      const meRes = await api.get('/api/auth/me');
      updateUser(meRes.data);

      setShowLinkedinForm(false);
      setLinkedinEmail('');
      setLinkedinPassword('');
      triggerToast('LinkedIn credentials connected successfully!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to connect LinkedIn credentials', 'error');
    } finally {
      setIsLinkedinLoading(false);
    }
  };

  // Preferences save
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setIsSavingPrefs(true);
    try {
      await api.put('/api/profile/preferences', {
        scheduledReportTime,
        reportEmail
      });
      triggerToast('Report preferences saved!', 'success');
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save preferences', 'error');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  // Danger Zone - Account wiping
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeletingAccount(true);
    try {
      await api.delete('/api/profile');
      triggerToast('Account deleted successfully', 'success');
      // Delay logout slightly so toast is visible
      setTimeout(() => {
        logout();
      }, 1000);
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete account', 'error');
      setIsDeletingAccount(false);
    }
  };

  // Extract initials
  const getInitials = (nameStr) => {
    if (!nameStr) return 'LP';
    return nameStr.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Extract filename from relative path
  const getResumeFileName = (url) => {
    if (!url) return '';
    const parts = url.split('/');
    const rawName = parts[parts.length - 1];
    // Remove user ID prefix if present: userId-timestamp.pdf
    const match = rawName.match(/^[a-f\d]{24}-\d+-(.*)$/i);
    return match ? match[1] : rawName;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 relative">
      
      {/* Toast Alert Box */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-white transition-all transform duration-300 translate-y-0 ${
          toast.type === 'error' ? 'bg-red-600' : toast.type === 'info' ? 'bg-blue-600' : 'bg-green-600'
        }`}>
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* TOP Profile Monogram */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#185FA5] text-white flex items-center justify-center font-bold text-xl shadow-lg border-2 border-white dark:border-gray-800">
          {getInitials(user?.name)}
        </div>
        <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
        {user?.createdAt && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      {/* CARD 1 — PERSONAL INFORMATION */}
      <form onSubmit={handleSaveProfile} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2">
          <UserIcon className="text-[#185FA5] w-5 h-5" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input 
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 dark:text-gray-500 mb-1.5">Email Address</label>
            <input 
              type="email"
              disabled
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              value={user?.email || ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
            <input 
              type="text"
              placeholder="+91 98765 43210"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Location</label>
            <input 
              type="text"
              placeholder="Bangalore, India"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Years of Experience</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          >
            <option value="">Select experience</option>
            <option value="0-1">0-1 years</option>
            <option value="1-3">1-3 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10+">10+ years</option>
          </select>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Target Roles</label>
          <TagInput 
            tags={targetRoles}
            setTags={setTargetRoles}
            placeholder="e.g. Frontend Engineer, Full Stack Dev"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Skills</label>
          <TagInput 
            tags={skills}
            setTags={setSkills}
            placeholder="e.g. React, Node.js, MongoDB"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#185FA5]"
          >
            Save changes
          </button>
        </div>
      </form>

      {/* CARD 2 — RESUME PORTAL */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2">
          <FileText className="text-[#185FA5] w-5 h-5" />
          Resume Manager
        </h3>

        {user?.resumeUrl ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-green-200 dark:border-green-900/30 rounded-xl bg-green-50/50 dark:bg-green-950/10 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{getResumeFileName(user.resumeUrl)}</p>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 dark:text-green-400 mt-1 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                  Resume on file
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a 
                href={user.resumeUrl.startsWith('/') ? `${api.defaults.baseURL || 'http://localhost:5000'}${user.resumeUrl}` : user.resumeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-white font-medium transition-colors"
              >
                <Download size={16} />
                Download
              </a>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-3 py-2 border border-[#185FA5] text-sm text-[#185FA5] hover:bg-blue-50 dark:hover:bg-blue-950/20 font-medium rounded-lg transition-colors"
              >
                Replace resume
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Dashed Drag & Drop Box */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-[#185FA5] bg-blue-50/30 dark:bg-blue-950/10' 
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-50 dark:bg-blue-900/10 rounded-full text-[#185FA5] mb-4">
                <Upload size={24} />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Upload your resume</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PDF only, max 5MB</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Click anywhere to browse or drag & drop file here</p>
            </div>

            {/* Upload Progress Loader */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-[#185FA5]">Uploading...</span>
                  <span className="text-xs font-semibold text-[#185FA5]">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#185FA5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        <input 
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf"
          onChange={handleFileChange}
        />
      </div>

      {/* CARD 3 — CONNECTED ACCOUNTS */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2">
          <Sparkles className="text-[#185FA5] w-5 h-5" />
          Connected Accounts
        </h3>

        {/* LinkedIn Connection Panel */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/10 text-blue-600">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">LinkedIn Automation</h4>
                  {user?.linkedinConnected ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Not connected</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for submitting job applications via LinkedIn Easy Apply</p>
                {user?.linkedinConnected && (
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex flex-col gap-0.5">
                    <p>Connected as: <span className="font-semibold text-gray-600 dark:text-gray-300">{user.linkedinEmail || user.linkedinName || 'LinkedIn User'}</span></p>
                    <p className="flex items-center gap-1"><Clock size={12} /> Used in last daily run</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto">
              {user?.linkedinConnected ? (
                <div>
                  {confirmDisconnectLinkedIn ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-lg p-2">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Are you sure?</span>
                      <button 
                        type="button"
                        onClick={handleDisconnectLinkedIn}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                      >
                        Yes, Disconnect
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConfirmDisconnectLinkedIn(false)}
                        className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectLinkedIn(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg text-sm font-semibold transition-colors w-full justify-center md:w-auto"
                    >
                      <LogOut size={16} />
                      Disconnect
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {!showLinkedinForm && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowLinkedinForm(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all w-full md:w-auto"
                      >
                        Connect via Credentials
                      </button>
                      <a
                        href={`${api.defaults.baseURL || 'http://localhost:5000'}/auth/linkedin?token=${token}`}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg shadow-sm transition-all w-full md:w-auto"
                      >
                        LinkedIn OAuth
                      </a>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expandable Credentials Form for LinkedIn */}
          {!user?.linkedinConnected && showLinkedinForm && (
            <form onSubmit={handleSaveLinkedin} className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">LinkedIn Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                    value={linkedinEmail}
                    onChange={(e) => setLinkedinEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">LinkedIn Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                    value={linkedinPassword}
                    onChange={(e) => setLinkedinPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkedinForm(false);
                    setLinkedinEmail('');
                    setLinkedinPassword('');
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLinkedinLoading}
                  className="px-4 py-2 bg-[#185FA5] hover:bg-[#15508a] text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isLinkedinLoading ? 'Connecting...' : 'Save LinkedIn Credentials'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Naukri Connection Panel */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 mb-5 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-600">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2M7.4 17V8l4.4 5.3V8h2.3v9l-4.4-5.3v5.3z"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Naukri Automation</h4>
                  {user?.naukriConnected ? (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Not connected</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Used for submitting job applications via Naukri</p>
                {user?.naukriConnected && (
                  <div className="mt-2 text-xs text-gray-400 dark:text-gray-500 flex flex-col gap-0.5">
                    <p>Connected as: <span className="font-semibold text-gray-600 dark:text-gray-300">{user.naukriEmail || user.naukriToken || 'Naukri User'}</span></p>
                    <p className="flex items-center gap-1"><Clock size={12} /> Used in last daily run</p>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto">
              {user?.naukriConnected ? (
                <div>
                  {confirmDisconnectNaukri ? (
                    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-lg p-2">
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">Are you sure?</span>
                      <button 
                        type="button"
                        onClick={handleDisconnectNaukri}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                      >
                        Yes, Disconnect
                      </button>
                      <button 
                        type="button"
                        onClick={() => setConfirmDisconnectNaukri(false)}
                        className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDisconnectNaukri(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg text-sm font-semibold transition-colors w-full justify-center md:w-auto"
                    >
                      <LogOut size={16} />
                      Disconnect
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full md:w-auto">
                  {!showNaukriForm && (
                    <button
                      type="button"
                      onClick={() => setShowNaukriForm(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all w-full md:w-auto"
                    >
                      Connect Naukri
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expandable Credentials Form for Naukri */}
          {!user?.naukriConnected && showNaukriForm && (
            <form onSubmit={handleSaveNaukri} className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Naukri Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                    value={naukriEmail}
                    onChange={(e) => setNaukriEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Naukri Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                    value={naukriPassword}
                    onChange={(e) => setNaukriPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowNaukriForm(false);
                    setNaukriEmail('');
                    setNaukriPassword('');
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isNaukriLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  {isNaukriLoading ? 'Connecting...' : 'Save Naukri Credentials'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Security small note bottom of card */}
        <div className="flex items-start gap-2.5 mt-5 text-[11px] text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-lg p-3">
          <Lock size={14} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
          <p>
            Your OAuth connection tokens and external scraper credentials are encrypted natively before db save and never shared. We strictly only execute headless interactions to submit direct applications on your behalf.
          </p>
        </div>
      </div>

      {/* CARD 4 — PREFERENCES & DANGER ZONE */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4 mb-6 flex items-center gap-2">
          <Clock className="text-[#185FA5] w-5 h-5" />
          Preferences & Email Reports
        </h3>

        <form onSubmit={handleSavePreferences} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Receive daily report at</label>
              <input 
                type="time"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                value={scheduledReportTime}
                onChange={(e) => setScheduledReportTime(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Send reports to</label>
              <input 
                type="email"
                required
                placeholder="name@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-700 dark:text-white"
                value={reportEmail}
                onChange={(e) => setReportEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSavingPrefs}
              className="px-4 py-2 border border-[#185FA5] text-sm font-semibold text-[#185FA5] hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-colors"
            >
              {isSavingPrefs ? 'Saving...' : 'Save preferences'}
            </button>
          </div>
        </form>

        {/* DANGER ZONE PANEL */}
        <div className="border border-red-200 dark:border-red-900/30 rounded-xl p-5 bg-red-50/20 dark:bg-red-950/5">
          <h4 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={16} />
            Danger Zone
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Permanently delete your LaunchPad account, resume file, search criteria, history runs, and application data. This action is fully irreversible.
          </p>

          <div className="mt-4">
            {showDeleteConfirm ? (
              <div className="border border-red-200 dark:border-red-900/40 bg-white dark:bg-gray-800 rounded-xl p-4 transition-all">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Are you absolutely certain? This wipes all MERN database models and unlinks storage assets.
                </p>
                <div className="mt-3">
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Type <span className="text-red-600">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DELETE"
                    className="w-full px-3 py-1.5 border border-red-300 dark:border-red-900/40 rounded-lg text-sm focus:ring-2 focus:ring-red-600 dark:bg-gray-700 dark:text-white"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 mt-4 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText('');
                    }}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={deleteConfirmText !== 'DELETE' || isDeletingAccount}
                    onClick={handleDeleteAccount}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeletingAccount ? 'Wiping...' : 'Delete permanently'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 border border-red-200 dark:border-red-900/30 hover:border-red-300 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/15 rounded-lg transition-colors"
              >
                Delete my account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FLOATING STICKY UNSAVED CHANGES INDICATOR BANNER */}
      {hasUnsavedChanges() && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl bg-amber-50 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 shadow-xl flex items-center justify-between gap-4 animate-bounce-subtle backdrop-blur-md">
          <div className="flex items-center gap-3 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="shrink-0 animate-pulse" size={20} />
            <div>
              <p className="text-sm font-semibold">Unsaved Profile Changes</p>
              <p className="text-xs opacity-90 mt-0.5">You have modified form parameters. Don't forget to commit changes!</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardChanges}
              className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-200 font-semibold transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={() => handleSaveProfile(null)}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 dark:bg-amber-700 dark:hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
            >
              Save changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
