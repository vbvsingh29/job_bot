import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import Pagination from '../components/Pagination';
import PlatformBadge from '../components/PlatformBadge';
import TagInput from '../components/TagInput';
import ToggleSwitch from '../components/ToggleSwitch';
import {
  Shield, Users, FileText, Cpu, Settings2, X,
  MoreVertical, CheckCircle2, AlertTriangle,
  RefreshCw, Zap, Mail, Activity, BarChart2,
  PlusCircle, Edit3, Trash2, Globe, ChevronDown,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/* ── helpers ── */
const initials = (name) => (name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
const relTime  = (d) => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—';
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Skeleton ── */
const Sk = ({ className = '' }) => <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;

/* ── Toast ── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  return { toast, show };
}

/* ── StatCard ── */
const StatCard = ({ label, value, loading }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
    {loading ? (<><Sk className="h-3 w-24 mb-3" /><Sk className="h-8 w-16" /></>) : (
      <>
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
      </>
    )}
  </div>
);

/* ── RoleBadge ── */
const RoleBadge = ({ role }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${role === 'admin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
    {role}
  </span>
);

/* ── SlidePanel ── */
const SlidePanel = ({ open, onClose, title, children }) => {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);
  return (
    <div className={`fixed inset-y-0 right-0 z-40 transition-transform duration-300 w-full max-w-md ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      {open && <div className="fixed inset-0 bg-black/30 lg:hidden" onClick={onClose} />}
      <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"><X size={18} /></button>
        </div>
        <div className="flex-1 p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

/* ═══ TAB 1 — OVERVIEW ═══ */
function OverviewTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/admin/stats')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const linkedin = data?.platformBreakdown?.find(p => p._id === 'linkedin')?.count || 0;
  const naukri   = data?.platformBreakdown?.find(p => p._id === 'naukri')?.count || 0;
  const total    = linkedin + naukri || 1;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Users"      value={data?.totalUsers}             loading={loading} />
        <StatCard label="Active Bots"      value={data?.activeUsers}            loading={loading} />
        <StatCard label="Total Apps"       value={data?.totalApps}              loading={loading} />
        <StatCard label="Apps Today"       value={data?.appsToday}              loading={loading} />
        <StatCard label="Success Rate"     value={data ? `${data.globalSuccessRate}%` : null} loading={loading} />
        <StatCard label="Successes Today"  value={data?.emailsSentToday}        loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Signups */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-[#185FA5]" /> Recent Signups
          </h3>
          {loading ? <div className="space-y-3">{[...Array(5)].map((_,i)=><Sk key={i} className="h-10 w-full"/>)}</div> : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {(data?.recentUsers||[]).map(u=>(
                <div key={u._id} className="flex items-center gap-3 py-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#185FA5] text-white flex items-center justify-center text-xs font-bold shrink-0">{initials(u.name)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <RoleBadge role={u.role}/>
                    <p className="text-xs text-gray-400 mt-1">{relTime(u.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Bars */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={16} className="text-[#185FA5]" /> Platform Breakdown
          </h3>
          {loading ? <div className="space-y-4"><Sk className="h-8 w-full"/><Sk className="h-8 w-full"/></div> : (
            <div className="space-y-5 mt-2">
              {[{label:'LinkedIn',count:linkedin,color:'bg-blue-500'},{label:'Naukri',count:naukri,color:'bg-amber-500'}].map(({label,count,color})=>(
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                    <span className="text-gray-500 dark:text-gray-400">{count} ({Math.round((count/total)*100)}%)</span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{width:`${Math.round((count/total)*100)}%`}}/>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-1">Total: {linkedin+naukri} applications across all users</p>
            </div>
          )}
        </div>
      </div>

      {/* Failures today */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-500" /> Failed Applications Today
        </h3>
        {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Sk key={i} className="h-10 w-full"/>)}</div>
        : !data?.failuresToday?.length ? (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500"/>
            <p className="text-sm">No failures today</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="text-left pb-2 font-semibold">User</th>
                <th className="text-left pb-2 font-semibold">Platform</th>
                <th className="text-left pb-2 font-semibold">Job</th>
                <th className="text-left pb-2 font-semibold">Error</th>
                <th className="text-left pb-2 font-semibold">Time</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.failuresToday.map((f,i)=>(
                  <tr key={i} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 pr-3 text-xs truncate max-w-[120px]">{f.userId?.email||'—'}</td>
                    <td className="py-2 pr-3"><PlatformBadge platform={f.platform}/></td>
                    <td className="py-2 pr-3 text-xs truncate max-w-[130px]">{f.jobTitle||'—'}</td>
                    <td className="py-2 pr-3 text-xs text-red-500 truncate max-w-[150px]">{f.errorMsg||'—'}</td>
                    <td className="py-2 text-xs text-gray-400 whitespace-nowrap">{relTime(f.appliedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ TAB 2 — USERS ═══ */
function UsersTab({ showToast }) {
  const [users, setUsers]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [pages, setPages]       = useState(1);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionTarget, setActionTarget]   = useState(null); // user id with open menu
  const [deleteId, setDeleteId] = useState(null);
  const timer = useRef(null);

  const load = useCallback((q, p) => {
    setLoading(true);
    api.get('/api/admin/users', { params: { search: q, page: p, limit: 20 } })
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(search, page); }, [page]);

  const handleSearch = (e) => {
    const v = e.target.value;
    setSearch(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setPage(1); load(v, 1); }, 400);
  };

  const openDetail = (user) => {
    setSelected(user);
    setDetailLoading(true);
    api.get(`/api/admin/users/${user._id}`)
      .then(r => { setDetail(r.data); setDetailLoading(false); })
      .catch(() => setDetailLoading(false));
  };

  const patch = async (id, body) => {
    try {
      const r = await api.patch(`/api/admin/users/${id}`, body);
      setUsers(us => us.map(u => u._id === id ? { ...u, ...r.data } : u));
      if (detail?.user?._id === id) setDetail(d => ({ ...d, user: { ...d.user, ...r.data } }));
      showToast('User updated');
    } catch { showToast('Update failed', 'error'); }
    setActionTarget(null);
  };

  const deleteUser = async (id) => {
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(us => us.filter(u => u._id !== id));
      setTotal(t => t - 1);
      if (selected?._id === id) { setSelected(null); setDetail(null); }
      showToast('User deleted');
    } catch { showToast('Delete failed', 'error'); }
    setDeleteId(null);
  };

  return (
    <div className="flex gap-0 relative">
      <div className={`flex-1 min-w-0 transition-all duration-300 ${selected ? 'mr-[420px]' : ''}`}>
        {/* Search */}
        <div className="mb-4">
          <input
            type="text" value={search} onChange={handleSearch}
            placeholder="Search by name or email..."
            className="w-full max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-[#185FA5] dark:bg-gray-800 dark:text-white"
          />
          <span className="ml-3 text-xs text-gray-400">{total} users</span>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">Last Login</th>
                  <th className="text-center px-4 py-3">Apps</th>
                  <th className="text-center px-4 py-3">Bot</th>
                  <th className="text-left px-4 py-3">Role</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {loading ? [...Array(5)].map((_,i)=>(
                  <tr key={i}><td colSpan={7} className="px-4 py-3"><Sk className="h-8 w-full"/></td></tr>
                )) : users.map(u => (
                  <tr key={u._id}
                    onClick={() => openDetail(u)}
                    className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${u.suspended ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#185FA5] text-white flex items-center justify-center text-xs font-bold shrink-0">{initials(u.name)}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{u.name}{u.suspended && <span className="ml-1 text-xs text-red-500">(suspended)</span>}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden lg:table-cell whitespace-nowrap">{relTime(u.lastLoginAt)}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-700 dark:text-gray-300">{u.appCount}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${u.botActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}/>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role}/></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="relative">
                        <button
                          onClick={() => setActionTarget(actionTarget === u._id ? null : u._id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        ><MoreVertical size={16}/></button>
                        {actionTarget === u._id && (
                          <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl w-48 py-1 text-sm">
                            <button onClick={() => patch(u._id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </button>
                            <button onClick={() => patch(u._id, { suspended: !u.suspended })}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {u.suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                            <hr className="my-1 border-gray-100 dark:border-gray-700"/>
                            <button onClick={() => { setDeleteId(u._id); setActionTarget(null); }}
                              className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600">
                              Delete user
                            </button>
                          </div>
                        )}
                      </div>
                      {deleteId === u._id && (
                        <div className="absolute right-12 z-30 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-900/40 rounded-xl shadow-xl p-3 w-52 text-xs text-gray-700 dark:text-gray-300">
                          <p className="font-semibold mb-2">Delete {u.name}?</p>
                          <p className="text-gray-500 mb-3">All data will be permanently wiped.</p>
                          <div className="flex gap-2">
                            <button onClick={() => setDeleteId(null)} className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg flex-1">Cancel</button>
                            <button onClick={() => deleteUser(u._id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg flex-1">Delete</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 && <div className="p-4 border-t border-gray-100 dark:border-gray-700"><Pagination page={page} pages={pages} onPageChange={setPage}/></div>}
        </div>
      </div>

      {/* Detail Panel */}
      <SlidePanel open={!!selected} onClose={() => { setSelected(null); setDetail(null); }} title={selected?.name || 'User Detail'}>
        {detailLoading ? (
          <div className="space-y-4">{[...Array(6)].map((_,i)=><Sk key={i} className="h-10 w-full"/>)}</div>
        ) : detail ? (
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Account</p>
              <div className="space-y-1 text-gray-700 dark:text-gray-300">
                <p><span className="font-medium">Email:</span> {detail.user.email}</p>
                <p><span className="font-medium">Joined:</span> {fmtDate(detail.user.createdAt)}</p>
                <p><span className="font-medium">Last login:</span> {relTime(detail.user.lastLoginAt)}</p>
                <p><span className="font-medium">Role:</span> <RoleBadge role={detail.user.role}/></p>
                <p><span className="font-medium">LinkedIn:</span> {detail.user.linkedinConnected ? '✓ Connected' : '✗ Not connected'}</p>
                <p><span className="font-medium">Naukri:</span> {detail.user.naukriConnected ? '✓ Connected' : '✗ Not connected'}</p>
                {detail.user.resumeUrl ? (
                  <p><span className="font-medium">Resume:</span> <a href={detail.user.resumeUrl} target="_blank" rel="noreferrer" className="text-[#185FA5] underline">Download</a></p>
                ) : <p><span className="font-medium">Resume:</span> None</p>}
              </div>
            </div>
            {detail.user.skills?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">{detail.user.skills.map(s=><span key={s} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">{s}</span>)}</div>
              </div>
            )}
            {detail.user.targetRoles?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Target Roles</p>
                <div className="flex flex-wrap gap-1.5">{detail.user.targetRoles.map(r=><span key={r} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs">{r}</span>)}</div>
              </div>
            )}
            {detail.config && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Automation Config</p>
                <div className="space-y-1 text-gray-700 dark:text-gray-300">
                  <p><span className="font-medium">Active:</span> {detail.config.active ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Max jobs/day:</span> {detail.config.maxJobsPerDay}</p>
                  <p><span className="font-medium">Last run:</span> {relTime(detail.config.lastRunAt)}</p>
                </div>
              </div>
            )}
            {detail.recentApps?.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Last 5 Applications</p>
                <div className="space-y-2">
                  {detail.recentApps.map(a => (
                    <div key={a._id} className="flex items-center justify-between text-xs border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px]">{a.jobTitle} @ {a.company}</p>
                        <p className="text-gray-400">{relTime(a.appliedAt)}</p>
                      </div>
                      <PlatformBadge platform={a.platform}/>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SlidePanel>
    </div>
  );
}

/* ═══ TAB 3 — CONTENT ═══ */
function ContentTab({ showToast }) {
  const [sub, setSub]           = useState('blog');
  const [posts, setPosts]       = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editPost, setEditPost]   = useState(null);
  const [addResOpen, setAddResOpen] = useState(false);
  const [editRes, setEditRes]     = useState(null);

  // Blog form state
  const [bTitle, setBTitle]     = useState('');
  const [bSlug, setBSlug]       = useState('');
  const [bCat, setBCat]         = useState('DSA');
  const [bTags, setBTags]       = useState([]);
  const [bContent, setBContent] = useState('');
  const [bPublished, setBPublished] = useState(false);
  const [bSaving, setBSaving]   = useState(false);

  // Resource form state
  const [rTitle, setRTitle]     = useState('');
  const [rUrl, setRUrl]         = useState('');
  const [rDesc, setRDesc]       = useState('');
  const [rCat, setRCat]         = useState('dsa');
  const [rTags, setRTags]       = useState([]);
  const [rBadge, setRBadge]     = useState('');
  const [rSaving, setRSaving]   = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/admin/blog'),
      api.get('/api/resources'),
    ]).then(([b, r]) => { setPosts(b.data); setResources(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openNew = () => {
    setEditPost(null); setBTitle(''); setBSlug(''); setBCat('DSA'); setBTags([]); setBContent(''); setBPublished(false);
    setEditorOpen(true);
  };
  const openEdit = (p) => {
    setEditPost(p); setBTitle(p.title); setBSlug(p.slug); setBCat(p.category); setBTags(p.tags||[]); setBContent(p.content); setBPublished(p.published);
    setEditorOpen(true);
  };

  const autoSlug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');

  const savePost = async (pub) => {
    setBSaving(true);
    const body = { title: bTitle, slug: bSlug||autoSlug(bTitle), category: bCat, tags: bTags, content: bContent, published: pub ?? bPublished };
    try {
      if (editPost) { const r = await api.put(`/api/blog/${editPost._id}`, body); setPosts(ps=>ps.map(p=>p._id===editPost._id?r.data:p)); }
      else { const r = await api.post('/api/blog', body); setPosts(ps=>[r.data,...ps]); }
      setEditorOpen(false); showToast(editPost ? 'Post updated' : 'Post created');
    } catch(e) { showToast(e.response?.data?.error||'Save failed','error'); }
    setBSaving(false);
  };

  const togglePublish = async (p) => {
    try { const r = await api.put(`/api/blog/${p._id}`, { published: !p.published }); setPosts(ps=>ps.map(x=>x._id===p._id?r.data:x)); showToast(`Post ${r.data.published?'published':'unpublished'}`); }
    catch { showToast('Update failed','error'); }
  };

  const deletePost = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try { await api.delete(`/api/blog/${p._id}`); setPosts(ps=>ps.filter(x=>x._id!==p._id)); showToast('Post deleted'); }
    catch { showToast('Delete failed','error'); }
  };

  const openAddRes = () => { setEditRes(null); setRTitle(''); setRUrl(''); setRDesc(''); setRCat('dsa'); setRTags([]); setRBadge(''); setAddResOpen(true); };
  const openEditRes = (r) => { setEditRes(r); setRTitle(r.title); setRUrl(r.url); setRDesc(r.description); setRCat(r.category); setRTags(r.tags||[]); setRBadge(r.badge?.text||''); setAddResOpen(true); };

  const saveRes = async () => {
    setRSaving(true);
    const body = { title: rTitle, url: rUrl, description: rDesc, category: rCat, tags: rTags, badge: rBadge ? { text: rBadge, color: 'blue' } : undefined };
    try {
      if (editRes) { const r = await api.put(`/api/resources/${editRes._id}`, body); setResources(rs=>rs.map(x=>x._id===editRes._id?r.data:x)); }
      else { const r = await api.post('/api/resources', body); setResources(rs=>[r.data,...rs]); }
      setAddResOpen(false); showToast(editRes?'Resource updated':'Resource added');
    } catch(e) { showToast(e.response?.data?.error||'Save failed','error'); }
    setRSaving(false);
  };

  const deleteRes = async (r) => {
    if (!window.confirm(`Delete "${r.title}"?`)) return;
    try { await api.delete(`/api/resources/${r._id}`); setResources(rs=>rs.filter(x=>x._id!==r._id)); showToast('Resource deleted'); }
    catch { showToast('Delete failed','error'); }
  };

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {['blog','resources'].map(s=>(
          <button key={s} onClick={()=>setSub(s)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${sub===s?'bg-[#185FA5] text-white':'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      {sub === 'blog' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{posts.length} posts</p>
            <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg hover:bg-[#15508a] transition-colors">
              <PlusCircle size={15}/> New post
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3 hidden md:table-cell">Category</th><th className="text-left px-4 py-3">Status</th><th className="text-left px-4 py-3 hidden lg:table-cell">Created</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {loading ? [...Array(4)].map((_,i)=><tr key={i}><td colSpan={5} className="px-4 py-3"><Sk className="h-8 w-full"/></td></tr>)
                : posts.map(p=>(
                  <tr key={p._id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{p.title}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-xs">{p.category}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.published?'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400':'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {p.published?'Published':'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={()=>openEdit(p)} className="p-1.5 text-gray-400 hover:text-[#185FA5] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit3 size={15}/></button>
                        <button onClick={()=>togglePublish(p)} className={`p-1.5 rounded-lg transition-colors ${p.published?'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20':'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                          <Globe size={15}/>
                        </button>
                        <button onClick={()=>deletePost(p)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {sub === 'resources' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{resources.length} resources</p>
            <button onClick={openAddRes} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg hover:bg-[#15508a] transition-colors">
              <PlusCircle size={15}/> Add resource
            </button>
          </div>
          {addResOpen && (
            <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900 space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{editRes?'Edit Resource':'New Resource'}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Title" value={rTitle} onChange={e=>setRTitle(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
                <input placeholder="URL" value={rUrl} onChange={e=>setRUrl(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
              </div>
              <textarea placeholder="Description" value={rDesc} onChange={e=>setRDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <select value={rCat} onChange={e=>setRCat(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]">
                  {['dsa','system-design','roadmaps','youtube','articles'].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Badge text (optional)" value={rBadge} onChange={e=>setRBadge(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
              </div>
              <TagInput tags={rTags} setTags={setRTags} placeholder="Tags..."/>
              <div className="flex gap-2 justify-end">
                <button onClick={()=>setAddResOpen(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">Cancel</button>
                <button onClick={saveRes} disabled={rSaving} className="px-4 py-2 text-sm bg-[#185FA5] text-white rounded-lg hover:bg-[#15508a] font-semibold">{rSaving?'Saving...':'Save'}</button>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr><th className="text-left px-4 py-3">Title</th><th className="text-left px-4 py-3 hidden md:table-cell">Category</th><th className="text-left px-4 py-3 hidden lg:table-cell">Added</th><th className="px-4 py-3">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                {loading ? [...Array(4)].map((_,i)=><tr key={i}><td colSpan={4} className="px-4 py-3"><Sk className="h-8 w-full"/></td></tr>)
                : resources.map(r=>(
                  <tr key={r._id} className="text-gray-700 dark:text-gray-300">
                    <td className="px-4 py-3 font-medium truncate max-w-[200px]">{r.title}</td>
                    <td className="px-4 py-3 text-xs hidden md:table-cell">{r.category}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={()=>openEditRes(r)} className="p-1.5 text-gray-400 hover:text-[#185FA5] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"><Edit3 size={15}/></button>
                        <button onClick={()=>deleteRes(r)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blog Editor Panel */}
      <SlidePanel open={editorOpen} onClose={()=>setEditorOpen(false)} title={editPost?'Edit Post':'New Post'}>
        <div className="space-y-4 text-sm">
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Title</label>
            <input value={bTitle} onChange={e=>{setBTitle(e.target.value);if(!editPost)setBSlug(autoSlug(e.target.value));}} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Slug</label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">/blog/</span>
              <input value={bSlug} onChange={e=>setBSlug(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
            </div>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Category</label>
            <select value={bCat} onChange={e=>setBCat(e.target.value)} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]">
              {['DSA','System Design','Career','Interview Tips','Other'].map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Tags</label>
            <TagInput tags={bTags} setTags={setBTags} placeholder="Add tags..."/>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Content (Markdown)</label>
            <textarea value={bContent} onChange={e=>setBContent(e.target.value)} rows={14}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5] resize-y"/>
            <p className="text-xs text-gray-400 mt-1">Supports markdown. Code blocks use ``` syntax.</p>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch enabled={bPublished} setEnabled={setBPublished}/>
            <span className="text-xs text-gray-600 dark:text-gray-400">Published</span>
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={()=>savePost(false)} disabled={bSaving} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Save draft</button>
            <button onClick={()=>savePost(true)} disabled={bSaving} className="flex-1 py-2 bg-[#185FA5] text-white rounded-lg text-xs font-semibold hover:bg-[#15508a]">{bSaving?'Saving...':'Publish'}</button>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

/* ═══ TAB 4 — AUTOMATIONS ═══ */
function AutomationsTab({ showToast }) {
  const [templates, setTemplates] = useState([]);
  const [errors, setErrors]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [editTpl, setEditTpl]     = useState(null);
  const [expanded, setExpanded]   = useState({});

  const [tName, setTName]         = useState('');
  const [tPlatform, setTPlatform] = useState('linkedin');
  const [tDesc, setTDesc]         = useState('');
  const [tKeywords, setTKeywords] = useState([]);
  const [tLocation, setTLocation] = useState('');
  const [tMaxJobs, setTMaxJobs]   = useState(15);
  const [tPublic, setTPublic]     = useState(false);
  const [tSaving, setTSaving]     = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/admin/templates'), api.get('/api/admin/errors', { params: { hours: 24 } })])
      .then(([t, e]) => { setTemplates(t.data); setErrors(e.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openNew = () => { setEditTpl(null); setTName(''); setTPlatform('linkedin'); setTDesc(''); setTKeywords([]); setTLocation(''); setTMaxJobs(15); setTPublic(false); setFormOpen(true); };
  const openEdit = (t) => { setEditTpl(t); setTName(t.name); setTPlatform(t.platform); setTDesc(t.description||''); setTKeywords(t.keywords||[]); setTLocation(t.defaultLocation||''); setTMaxJobs(t.suggestedMaxJobs||15); setTPublic(t.public||false); setFormOpen(true); };

  const saveTpl = async () => {
    setTSaving(true);
    const body = { name:tName, platform:tPlatform, description:tDesc, keywords:tKeywords, defaultLocation:tLocation, suggestedMaxJobs:tMaxJobs, public:tPublic };
    try {
      if (editTpl) { const r = await api.put(`/api/admin/templates/${editTpl._id}`, body); setTemplates(ts=>ts.map(x=>x._id===editTpl._id?r.data:x)); }
      else { const r = await api.post('/api/admin/templates', body); setTemplates(ts=>[r.data,...ts]); }
      setFormOpen(false); showToast(editTpl?'Template updated':'Template created');
    } catch { showToast('Save failed','error'); }
    setTSaving(false);
  };

  const deleteTpl = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try { await api.delete(`/api/admin/templates/${t._id}`); setTemplates(ts=>ts.filter(x=>x._id!==t._id)); showToast('Template deleted'); }
    catch { showToast('Delete failed','error'); }
  };

  const togglePublic = async (t) => {
    try { const r = await api.put(`/api/admin/templates/${t._id}`, { public: !t.public }); setTemplates(ts=>ts.map(x=>x._id===t._id?r.data:x)); showToast('Updated'); }
    catch { showToast('Update failed','error'); }
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2"><Cpu size={16} className="text-[#185FA5]"/> Automation Templates</h3>
          <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg hover:bg-[#15508a]">
            <PlusCircle size={15}/> Create template
          </button>
        </div>

        {formOpen && (
          <div className="mb-4 border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-gray-900 space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{editTpl?'Edit Template':'New Template'}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input placeholder="Template name" value={tName} onChange={e=>setTName(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
              <select value={tPlatform} onChange={e=>setTPlatform(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]">
                <option value="linkedin">LinkedIn</option>
                <option value="naukri">Naukri</option>
              </select>
            </div>
            <textarea placeholder="Description" value={tDesc} onChange={e=>setTDesc(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Default location" value={tLocation} onChange={e=>setTLocation(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
              <input type="number" placeholder="Max jobs" min={1} max={50} value={tMaxJobs} onChange={e=>setTMaxJobs(+e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#185FA5]"/>
            </div>
            <TagInput tags={tKeywords} setTags={setTKeywords} placeholder="Keywords (e.g. React, Node.js)"/>
            <div className="flex items-center gap-2">
              <ToggleSwitch enabled={tPublic} setEnabled={setTPublic}/>
              <span className="text-xs text-gray-600 dark:text-gray-400">Public (visible to users)</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setFormOpen(false)} className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400">Cancel</button>
              <button onClick={saveTpl} disabled={tSaving} className="px-4 py-2 text-sm bg-[#185FA5] text-white rounded-lg font-semibold hover:bg-[#15508a]">{tSaving?'Saving...':'Save'}</button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr><th className="text-left px-4 py-3">Name</th><th className="text-left px-4 py-3">Platform</th><th className="text-left px-4 py-3 hidden md:table-cell">Description</th><th className="text-center px-4 py-3">Public</th><th className="px-4 py-3">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {loading ? [...Array(3)].map((_,i)=><tr key={i}><td colSpan={5} className="px-4 py-3"><Sk className="h-8 w-full"/></td></tr>)
              : !templates.length ? <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No templates yet. Create one above.</td></tr>
              : templates.map(t=>(
                <tr key={t._id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3"><PlatformBadge platform={t.platform}/></td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell truncate max-w-[180px]">{t.description||'—'}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={()=>togglePublic(t)} className={`w-4 h-4 rounded border-2 ${t.public?'bg-[#185FA5] border-[#185FA5]':'border-gray-300 dark:border-gray-600'}`}/>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={()=>openEdit(t)} className="p-1.5 text-gray-400 hover:text-[#185FA5] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit3 size={15}/></button>
                      <button onClick={()=>deleteTpl(t)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error groups */}
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500"/> Failed Automation Errors — Last 24h</h3>
        {loading ? <div className="space-y-2">{[...Array(3)].map((_,i)=><Sk key={i} className="h-12 w-full"/>)}</div>
        : !errors.length ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <CheckCircle2 size={32} className="mx-auto mb-2 text-green-500"/>
            <p className="text-sm text-gray-400">No automation errors in the last 24 hours</p>
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map(g=>(
              <div key={g.errorType} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                <button onClick={()=>setExpanded(e=>({...e,[g.errorType]:!e[g.errorType]}))} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold">{g.count}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{g.errorType}</span>
                    <PlatformBadge platform={g.platform}/>
                  </div>
                  {expanded[g.errorType] ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400 -rotate-90"/>}
                </button>
                {expanded[g.errorType] && (
                  <div className="border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-800">
                    {g.occurrences.map((o,i)=>(
                      <div key={i} className="flex items-center gap-4 px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium truncate max-w-[140px]">{o.userEmail}</span>
                        <span className="text-gray-400 truncate flex-1">{o.message||o.jobTitle||'—'}</span>
                        <span className="whitespace-nowrap text-gray-400">{relTime(o.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ TAB 5 — SETTINGS ═══ */
function SettingsTab({ showToast }) {
  const [sched, setSched]             = useState(null);
  const [schedLoading, setSchedLoading] = useState(true);
  const [runAllConfirm, setRunAllConfirm] = useState(false);
  const [runAllLoading, setRunAllLoading] = useState(false);
  const [emailConfirm, setEmailConfirm]   = useState(false);
  const [emailLoading, setEmailLoading]   = useState(false);
  const [platformTest, setPlatformTest]   = useState({});
  const [platformLoading, setPlatformLoading] = useState({});

  useEffect(() => {
    api.get('/api/admin/scheduler/status')
      .then(r => { setSched(r.data); setSchedLoading(false); })
      .catch(() => setSchedLoading(false));
  }, []);

  const runAll = async () => {
    setRunAllLoading(true);
    try { await api.post('/api/automations/run-all'); showToast('Global run triggered for all active users'); }
    catch { showToast('Failed to trigger run','error'); }
    setRunAllLoading(false); setRunAllConfirm(false);
  };

  const sendEmails = async () => {
    setEmailLoading(true);
    try { await api.post('/api/automations/send-report'); showToast('Email digest triggered'); }
    catch { showToast('Failed to send emails','error'); }
    setEmailLoading(false); setEmailConfirm(false);
  };

  const testPlatform = async (platform) => {
    setPlatformLoading(p => ({ ...p, [platform]: true }));
    try {
      const r = await api.post('/api/admin/test-platform', { platform });
      setPlatformTest(p => ({ ...p, [platform]: r.data }));
    } catch { setPlatformTest(p => ({ ...p, [platform]: { success: false, message: 'Request failed' } })); }
    setPlatformLoading(p => ({ ...p, [platform]: false }));
  };

  const Card = ({ children, className='' }) => (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm ${className}`}>{children}</div>
  );
  const SectionTitle = ({ children }) => (
    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">{children}</h3>
  );

  return (
    <div className="max-w-2xl space-y-5">
      {/* Scheduler Status */}
      <Card>
        <SectionTitle>Scheduler Status</SectionTitle>
        {schedLoading ? <div className="space-y-3"><Sk className="h-8 w-full"/><Sk className="h-8 w-full"/></div> : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Daily Bot Runner</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sched?.botRunner?.description}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Running
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Email Digest</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sched?.emailDigest?.description}</p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>Running
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Triggers */}
      <Card>
        <SectionTitle>Manual Triggers</SectionTitle>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Run all bots now</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Triggers automation for ALL active users immediately</p>
            </div>
            {runAllConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Are you sure?</span>
                <button onClick={()=>setRunAllConfirm(false)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">Cancel</button>
                <button onClick={runAll} disabled={runAllLoading} className="px-3 py-1.5 text-xs bg-[#185FA5] text-white rounded-lg font-semibold hover:bg-[#15508a]">
                  {runAllLoading ? 'Running...' : 'Confirm'}
                </button>
              </div>
            ) : (
              <button onClick={()=>setRunAllConfirm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-xs font-semibold rounded-lg hover:bg-[#15508a] whitespace-nowrap">
                <Zap size={14}/> Run all bots
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Send email digests now</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sends daily digest emails to all active users</p>
            </div>
            {emailConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 dark:text-red-400 font-semibold">Confirm send?</span>
                <button onClick={()=>setEmailConfirm(false)} className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500">Cancel</button>
                <button onClick={sendEmails} disabled={emailLoading} className="px-3 py-1.5 text-xs bg-[#185FA5] text-white rounded-lg font-semibold">
                  {emailLoading ? 'Sending...' : 'Confirm'}
                </button>
              </div>
            ) : (
              <button onClick={()=>setEmailConfirm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#185FA5] text-[#185FA5] text-xs font-semibold rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 whitespace-nowrap">
                <Mail size={14}/> Send digests
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Platform Health */}
      <Card>
        <SectionTitle>Platform Health</SectionTitle>
        <div className="space-y-3">
          {['linkedin','naukri'].map(p => (
            <div key={p} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-3">
                <PlatformBadge platform={p}/>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">{p} Connection</p>
                  {platformTest[p] && (
                    <p className={`text-xs mt-0.5 ${platformTest[p].success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {platformTest[p].message}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => testPlatform(p)}
                disabled={platformLoading[p]}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 whitespace-nowrap"
              >
                <RefreshCw size={13} className={platformLoading[p] ? 'animate-spin' : ''}/>
                {platformLoading[p] ? 'Testing...' : `Test ${p}`}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Email Config */}
      <Card>
        <SectionTitle>Email Configuration</SectionTitle>
        <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="font-medium">Report email</span>
            <span className="text-gray-500 font-mono text-xs">{import.meta.env.VITE_REPORT_EMAIL || 'Set in .env'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <span className="font-medium">Email service</span>
            <span className="px-2.5 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-semibold">Gmail SMTP</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══ MAIN ADMIN PANEL ═══ */
const TABS = [
  { key: 'overview',    label: 'Overview',    icon: BarChart2 },
  { key: 'users',       label: 'Users',       icon: Users },
  { key: 'content',     label: 'Content',     icon: FileText },
  { key: 'automations', label: 'Automations', icon: Cpu },
  { key: 'settings',    label: 'Settings',    icon: Settings2 },
];

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const { toast, show: showToast } = useToast();

  const setTab = (key) => setSearchParams({ tab: key });

  return (
    <div className="relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-xl text-white text-sm font-medium transition-all ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <AlertTriangle size={16}/> : <CheckCircle2 size={16}/>}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="text-[#185FA5] w-5 h-5"/>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage users, content, automations and platform settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === key
                ? 'bg-[#185FA5] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Icon size={15}/> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview'    && <OverviewTab />}
      {activeTab === 'users'       && <UsersTab showToast={showToast} />}
      {activeTab === 'content'     && <ContentTab showToast={showToast} />}
      {activeTab === 'automations' && <AutomationsTab showToast={showToast} />}
      {activeTab === 'settings'    && <SettingsTab showToast={showToast} />}
    </div>
  );
}
