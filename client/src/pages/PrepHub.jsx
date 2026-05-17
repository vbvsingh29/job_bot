import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Code, Zap, Map, ArrowRight, ExternalLink, Calendar, Clock, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';
import Navbar from '../components/Navbar';

export default function PrepHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [resources, setResources] = useState([]);
  const [blogs, setBlogs] = useState([]);
  
  const [isLoadingResources, setIsLoading] = useState(true);
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(true);
  
  // Extract category and search from URL Search Params
  const activeTab = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';
  const [localSearch, setLocalSearch] = useState(urlSearch);

  // Set document title
  useEffect(() => {
    document.title = 'Prep Hub | LaunchPad';
  }, []);

  // Sync local search input with URL parameter
  useEffect(() => {
    setLocalSearch(urlSearch);
  }, [urlSearch]);

  // Debounce search filter input by 400ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (urlSearch !== localSearch) {
        const nextParams = new URLSearchParams(searchParams);
        if (localSearch) {
          nextParams.set('search', localSearch);
        } else {
          nextParams.delete('search');
        }
        nextParams.delete('page'); // Reset pagination if any
        setSearchParams(nextParams);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [localSearch]);

  // Handle category tab change
  const handleTabChange = (category) => {
    const nextParams = new URLSearchParams(searchParams);
    if (category && category !== 'all') {
      nextParams.set('category', category);
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  // Fetch Resources from Backend
  useEffect(() => {
    const controller = new AbortController();
    
    async function fetchResources() {
      setIsLoading(true);
      try {
        const params = {};
        if (activeTab && activeTab !== 'all') {
          params.category = activeTab;
        }
        if (urlSearch) {
          params.search = urlSearch;
        }

        const res = await api.get('/api/resources', {
          params,
          signal: controller.signal
        });
        setResources(res.data || []);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          console.error('Failed to load resources:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchResources();
    return () => controller.abort();
  }, [activeTab, urlSearch]);

  // Fetch Blog Posts from Backend
  useEffect(() => {
    async function fetchBlogs() {
      setIsLoadingBlogs(true);
      try {
        const res = await api.get('/api/blog', {
          params: { limit: 6, published: true }
        });
        setBlogs(res.data || []);
      } catch (err) {
        console.error('Failed to load blogs:', err);
      } finally {
        setIsLoadingBlogs(false);
      }
    }

    fetchBlogs();
  }, []);

  // Handle smooth scroll to #blog section if present in hash
  useEffect(() => {
    if (window.location.hash === '#blog') {
      const blogSection = document.getElementById('blog');
      if (blogSection) {
        setTimeout(() => {
          blogSection.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    }
  }, [window.location.hash, blogs]);

  // Hardcoded Featured Resources (always at top when category = All or DSA)
  const featuredResources = useMemo(() => {
    return [
      {
        title: 'Striver A2Z DSA Sheet',
        description: '450+ problems covering every DSA topic from scratch. The most popular structured sheet.',
        url: 'https://takeuforward.org/strivers-a2z-dsa-course',
        category: 'DSA',
        icon: <Code className="w-5 h-5 text-amber-500" />,
        badge: 'Most Popular',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      },
      {
        title: 'NeetCode 150',
        description: '150 carefully selected LeetCode problems covering all patterns needed for FAANG interviews.',
        url: 'https://neetcode.io/practice',
        category: 'DSA',
        icon: <Zap className="w-5 h-5 text-blue-500" />,
        badge: 'FAANG Focused',
        badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      {
        title: 'roadmap.sh',
        description: 'Visual roadmaps for Frontend, Backend, DevOps, and more. Know exactly what to learn next.',
        url: 'https://roadmap.sh',
        category: 'Roadmaps',
        icon: <Map className="w-5 h-5 text-green-500" />,
        badge: 'Visual Guide',
        badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      }
    ];
  }, []);

  // Determine if featured cards should render
  const showFeatured = (activeTab === 'all' || activeTab === 'dsa') && !urlSearch;

  // Tabs structure
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'dsa', label: 'DSA' },
    { id: 'system-design', label: 'System Design' },
    { id: 'roadmap', label: 'Roadmaps' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'other', label: 'Articles' }
  ];

  return (
    <div className="min-h-screen bg-bg-body text-text-primary flex flex-col pt-20">
      <Navbar />

      {/* Hero Section */}
      <header className="py-16 sm:py-24 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#185FA5]/10 text-[#185FA5] dark:bg-[#60A5FA]/10 dark:text-[#60A5FA]">
            Free for everyone
          </span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-tight max-w-3xl mx-auto">
          Everything you need to crack your next interview
        </h1>
        
        <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto">
          Curated resources, DSA sheets, roadmaps and guides — all in one place. No signup required.
        </p>

        {/* Search bar input */}
        <div className="relative max-w-2xl mx-auto flex items-center mt-8">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search resources, topics, tools..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-surface border border-border-default rounded-xl focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:focus:ring-[#60A5FA] transition-all text-text-primary shadow-sm"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-4 text-text-secondary hover:text-text-primary text-sm font-semibold"
            >
              Clear
            </button>
          )}
        </div>
      </header>

      {/* Category Navigation Tabs */}
      <section className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto py-2 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`text-sm font-semibold pb-4 border-b-2 whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-[#185FA5] text-[#185FA5] dark:border-[#60A5FA] dark:text-[#60A5FA]'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Resources Section */}
      {showFeatured && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-xl font-bold mb-6 text-text-primary flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            Featured Sheets & Roadmaps
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredResources.map((item, idx) => (
              <a
                key={idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-6 bg-surface border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm">
                      {item.icon}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-text-primary mb-2 flex items-center gap-1">
                    {item.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#185FA5] dark:text-[#60A5FA] mt-6">
                  Visit resource
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Dynamic Resource Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1">
        <h2 className="text-xl font-bold mb-6 text-text-primary">
          {showFeatured ? 'More Learning Materials' : 'Curated Resources'}
        </h2>

        {isLoadingResources ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="p-6 border border-border-default bg-surface rounded-2xl animate-pulse space-y-4">
                <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="flex gap-2">
                  <div className="h-5 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="h-5 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : resources.length > 0 ? (
          /* Populated cards list */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((item) => (
              <a
                key={item._id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between p-6 bg-surface border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    {/* Category badges */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      item.category === 'dsa' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : item.category === 'system-design'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : item.category === 'roadmap'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : item.category === 'youtube'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                    }`}>
                      {item.category === 'system-design' ? 'System Design' : item.category}
                    </span>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 bg-amber-100/30 px-2 py-0.5 rounded-md">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-1 flex items-center gap-1.5">
                    {item.title}
                    <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                  </h3>
                  
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6">
                  {/* Small tags list */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {item.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs font-semibold text-[#185FA5] dark:text-[#60A5FA]">
                    Visit resource
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-16 bg-surface border border-border-default rounded-2xl p-8 max-w-lg mx-auto">
            <BookOpen className="w-12 h-12 text-text-secondary mb-4 mx-auto" />
            <h3 className="text-lg font-semibold text-text-primary mb-1">No resources yet in this category</h3>
            <p className="text-sm text-text-secondary">
              Try checking other category tabs or search keywords!
            </p>
          </div>
        )}
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 border-t border-gray-200 dark:border-gray-800 bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-text-primary">From the blog</h2>
            <p className="text-sm text-text-secondary mt-1">
              Interview tips, career advice, and technical deep-dives
            </p>
          </div>

          {isLoadingBlogs ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-surface border border-border-default rounded-2xl p-6 animate-pulse space-y-4">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full" />
                  <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : blogs.length > 0 ? (
            /* Blogs Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((post) => (
                <Link
                  key={post._id}
                  to={`/blog/${post.slug}`}
                  className="flex flex-col justify-between p-6 bg-surface border border-border-default rounded-2xl hover:shadow-md transition-all hover:scale-[1.01]"
                >
                  <div className="space-y-4">
                    {/* Category */}
                    <div>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        post.category === 'dsa' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                          : post.category === 'career'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : post.category === 'system-design'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {post.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-text-primary line-clamp-2 leading-snug hover:text-[#185FA5] transition-colors">
                      {post.title}
                    </h3>

                    {/* Excerpt */}
                    <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
                      {post.content ? post.content.replace(/[#*`>_\-]/g, '').substring(0, 150) + '...' : ''}
                    </p>
                  </div>

                  {/* Footer Meta info */}
                  <div className="flex items-center justify-between text-xs text-text-secondary mt-8 pt-4 border-t border-gray-100 dark:border-gray-800/65">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{post.readTime} min read</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              No blog posts published yet.
            </div>
          )}
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="bg-gray-950 text-gray-400 py-6 border-t border-gray-900 text-center text-xs">
        <p>© {new Date().getFullYear()} LaunchPad. Built for ambitious developers.</p>
      </footer>
    </div>
  );
}
