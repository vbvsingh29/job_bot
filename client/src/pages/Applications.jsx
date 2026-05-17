import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Download, Briefcase, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../utils/api';
import FilterBar from '../components/FilterBar';
import ApplicationsTable from '../components/ApplicationsTable';
import ApplicationCard from '../components/ApplicationCard';
import Pagination from '../components/Pagination';

export default function Applications() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Extract filter parameters from URL Search Params
  const filters = useMemo(() => {
    return {
      platform: searchParams.get('platform') || '',
      status: searchParams.get('status') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      search: searchParams.get('search') || '',
      page: parseInt(searchParams.get('page') || '1')
    };
  }, [searchParams]);

  // Fetch applications on filter changes with cancellation support
  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchApplications() {
      setIsLoading(true);
      try {
        const params = {
          page: filters.page,
          limit: 20
        };
        if (filters.platform) params.platform = filters.platform;
        if (filters.status) params.status = filters.status;
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (filters.search) params.search = filters.search;

        const res = await api.get('/api/applications', {
          params,
          signal: abortController.signal
        });

        if (res.data) {
          setApplications(res.data.applications || []);
          setTotalPages(res.data.totalPages || 0);
          setTotalItems(res.data.totalItems || 0);
        }
      } catch (err) {
        if (!axiosIsCancel(err)) {
          console.error('Error fetching applications:', err);
          toast.error('Failed to load applications');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchApplications();

    return () => {
      abortController.abort();
    };
  }, [filters]);

  // Helper check for AbortController cancellation
  function axiosIsCancel(err) {
    return err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED';
  }

  // Update URL Search Params when individual filters change
  const handleFilterChange = (key, value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }
    // Always reset page to 1 when changing filters
    if (key !== 'page') {
      nextParams.delete('page');
    }
    setSearchParams(nextParams);
  };

  const handlePageChange = (pageNumber) => {
    handleFilterChange('page', pageNumber.toString());
  };

  const handleResetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  // Secure CSV exporter that uses our authorized Axios client and a blob URL
  const handleExportCSV = async () => {
    toast.loading('Preparing CSV export...', { id: 'csv-export' });
    try {
      const params = {};
      if (filters.platform) params.platform = filters.platform;
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      if (filters.search) params.search = filters.search;

      const res = await api.get('/api/applications/export', {
        params,
        responseType: 'blob'
      });

      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `launchpad_applications_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('CSV downloaded successfully!', { id: 'csv-export' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to export CSV.', { id: 'csv-export' });
    }
  };

  const hasFiltersApplied = filters.platform || filters.status || filters.from || filters.to || filters.search;

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Applications</h2>
          <p className="text-sm text-text-secondary mt-1">Track every job you've applied to</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Total entries pill */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-light text-primary dark:bg-primary-dark/20 dark:text-[#60A5FA]">
            {totalItems} total
          </span>

          {/* Export CSV action */}
          <button
            onClick={handleExportCSV}
            disabled={isLoading || totalItems === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#124b82] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Persistent Filters Bar */}
      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Main Results Container */}
      <div className="min-h-[300px]">
        {isLoading ? (
          /* Loading Skeleton */
          <ApplicationsTable applications={[]} isLoading={true} currentPage={filters.page} />
        ) : applications.length > 0 ? (
          /* Populated state */
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <ApplicationsTable
                applications={applications}
                isLoading={false}
                currentPage={filters.page}
              />
            </div>

            {/* Mobile Card Grid View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {applications.map((app) => (
                <ApplicationCard key={app._id} application={app} />
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={filters.page}
              totalPages={totalPages}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          </div>
        ) : hasFiltersApplied ? (
          /* Empty state: Filters matching nothing */
          <div className="p-12 flex flex-col items-center justify-center text-center bg-surface border border-border-default rounded-2xl">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 text-text-secondary mb-4">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">No applications match your filters</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-xs">
              Try adjusting your query term, dates, platform choices, or reset all active filter nodes.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 border border-border-default text-text-primary rounded-lg text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Reset filters
            </button>
          </div>
        ) : (
          /* Empty state: Total empty application list */
          <div className="p-12 flex flex-col items-center justify-center text-center bg-surface border border-border-default rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary-light text-primary dark:bg-primary-dark/20 mb-4">
              <Briefcase className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">No applications yet</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              Run your first automation and let our stealth bot apply to jobs on your behalf.
            </p>
            <button
              onClick={() => navigate('/control-panel')}
              className="mt-6 flex items-center gap-1.5 px-4 py-2 bg-[#185FA5] text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-[#124b82] transition-colors"
            >
              Go to Control Panel
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
