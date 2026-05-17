import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, User } from 'lucide-react';
import { marked } from 'marked';
import { format } from 'date-fns';
import api from '../utils/api';
import Navbar from '../components/Navbar';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPost() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/blog/${slug}`);
        setPost(res.data);
        if (res.data?.title) {
          document.title = `${res.data.title} | LaunchPad`;
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(err.response?.status === 404 ? 'Article not found' : 'Failed to load article');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  // Scroll to top on page mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Clean layout - full width page with navbar, no AppShell sidebar
  return (
    <div className="min-h-screen bg-bg-body text-text-primary flex flex-col pt-24 pb-16">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation */}
        <Link
          to="/prep-hub"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-[#185FA5] dark:hover:text-[#60A5FA] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Prep Hub
        </Link>

        {isLoading ? (
          /* Loading Skeletons */
          <div className="space-y-6 animate-pulse">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
            <div className="h-10 w-3/4 bg-gray-200 dark:bg-gray-800 rounded-lg" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="border-t border-gray-200 dark:border-gray-800 my-6" />
            <div className="space-y-4">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
          </div>
        ) : error ? (
          /* Error / 404 state */
          <div className="text-center py-20 bg-surface border border-border-default rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-2">{error}</h2>
            <p className="text-text-secondary mb-6">
              The article you are looking for does not exist or has been removed.
            </p>
            <Link
              to="/prep-hub"
              className="px-6 py-2.5 bg-[#185FA5] hover:bg-[#124b82] text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
            >
              Return to Prep Hub
            </Link>
          </div>
        ) : (
          /* Populated article view */
          <article className="space-y-6">
            
            {/* Category tag */}
            <div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                post.category?.toLowerCase() === 'dsa' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                  : post.category?.toLowerCase() === 'system-design'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  : post.category?.toLowerCase() === 'career'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {post.category || 'Interview Tips'}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary leading-tight">
              {post.title}
            </h1>

            {/* Meta Row info */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-text-secondary pb-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-text-secondary" />
                <span className="font-semibold text-text-primary">{post.author}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.createdAt), 'MMMM dd, yyyy')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{post.readTime} min read</span>
              </div>
            </div>

            {/* Markdown Body Content with Custom Prose Styling */}
            <div 
              className="blog-content mt-8"
              dangerouslySetInnerHTML={{ __html: marked.parse(post.content || '') }}
            />

          </article>
        )}

      </main>
    </div>
  );
}
