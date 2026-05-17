import React, { useState, useEffect } from 'react';
import { Search, X, Calendar } from 'lucide-react';

export default function FilterBar({ filters, onFilterChange, onReset }) {
  const { platform, status, from, to, search } = filters;
  const [localSearch, setLocalSearch] = useState(search || '');

  // Debounce search input value updates by 400ms
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== localSearch) {
        onFilterChange('search', localSearch);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [localSearch]);

  // Synchronize local search with external filter changes (e.g. on reset)
  useEffect(() => {
    setLocalSearch(search || '');
  }, [search]);

  const hasActiveFilters = platform || status || from || to || search;

  return (
    <div className="sticky top-0 z-10 bg-bg-body/95 backdrop-blur-md py-4 border-b border-gray-200 dark:border-gray-800">
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        
        {/* Left: Interactive filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search job title or company..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 pr-8 w-full py-2 bg-surface text-sm border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all text-text-primary"
            />
            {localSearch && (
              <button
                onClick={() => setLocalSearch('')}
                className="absolute right-3 top-3 text-text-secondary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Platform select dropdown */}
          <select
            value={platform || ''}
            onChange={(e) => onFilterChange('platform', e.target.value)}
            className="px-3 py-2 bg-surface text-sm border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all text-text-primary min-w-[140px]"
          >
            <option value="">All Platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="naukri">Naukri</option>
          </select>

          {/* Status select dropdown */}
          <select
            value={status || ''}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="px-3 py-2 bg-surface text-sm border border-border-default rounded-lg focus:outline-none focus:ring-1 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all text-text-primary min-w-[140px]"
          >
            <option value="">All Statuses</option>
            <option value="success">Applied</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>

          {/* Date range pickers */}
          <div className="flex items-center gap-2 bg-surface border border-border-default px-3 py-1.5 rounded-lg text-text-primary">
            <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
            <div className="flex items-center gap-1 text-xs">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">From:</span>
              <input
                type="date"
                value={from || ''}
                onChange={(e) => onFilterChange('from', e.target.value)}
                className="bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs w-[110px]"
              />
              <span className="text-[11px] font-semibold text-text-secondary uppercase ml-1">To:</span>
              <input
                type="date"
                value={to || ''}
                onChange={(e) => onFilterChange('to', e.target.value)}
                className="bg-transparent border-0 focus:outline-none focus:ring-0 p-0 text-xs w-[110px]"
              />
            </div>
            {(from || to) && (
              <button
                onClick={() => {
                  onFilterChange('from', '');
                  onFilterChange('to', '');
                }}
                className="text-xs text-danger font-semibold hover:underline border-l border-border-default pl-2 ml-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Reset Action */}
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 self-end lg:self-center text-xs font-semibold text-danger hover:underline py-2"
          >
            <X className="w-4 h-4" />
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
}
