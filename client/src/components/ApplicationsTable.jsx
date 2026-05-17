import React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import { ExternalLink } from 'lucide-react';

export default function ApplicationsTable({ applications, isLoading, currentPage, limit = 20 }) {
  
  const truncateText = (text, maxLength) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto bg-surface rounded-xl border border-border-default">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800/50">
            <tr>
              {['#', 'Job Title', 'Company', 'Platform', 'Status', 'Applied', 'Error'].map((col, idx) => (
                <th
                  key={idx}
                  className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {[...Array(5)].map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="px-6 py-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" /></td>
                <td className="px-6 py-4"><div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" /></td>
                <td className="px-6 py-4"><div className="h-4 w-36 bg-gray-200 dark:bg-gray-700 rounded" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-surface rounded-xl border border-border-default">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {['#', 'Job Title', 'Company', 'Platform', 'Status', 'Applied', 'Error'].map((col, idx) => (
              <th
                key={idx}
                className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {applications.map((app, index) => {
            const absoluteRowNumber = (currentPage - 1) * limit + index + 1;
            const isFailed = app.status?.toLowerCase() === 'failed';
            const formattedDate = format(new Date(app.appliedAt), 'PPP p');
            const timeDistance = formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true });

            return (
              <tr
                key={app._id}
                className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                  isFailed 
                    ? 'border-l-2 border-red-500/70 bg-red-50/5 dark:bg-red-950/5' 
                    : ''
                }`}
              >
                {/* Row number */}
                <td className="px-6 py-4 text-sm font-medium text-text-secondary">
                  {absoluteRowNumber}
                </td>

                {/* Job Title */}
                <td className="px-6 py-4 text-sm font-semibold text-text-primary max-w-[240px]">
                  {app.url ? (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={app.jobTitle}
                      className="inline-flex items-center gap-1.5 hover:text-[#185FA5] hover:underline group min-w-0"
                    >
                      <span className="truncate">{truncateText(app.jobTitle, 35)}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </a>
                  ) : (
                    <span title={app.jobTitle} className="truncate block">
                      {truncateText(app.jobTitle, 35)}
                    </span>
                  )}
                </td>

                {/* Company */}
                <td className="px-6 py-4 text-sm text-text-secondary truncate max-w-[160px]" title={app.company}>
                  {app.company}
                </td>

                {/* Platform */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <PlatformBadge platform={app.platform} />
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={app.status} />
                </td>

                {/* Applied relative time */}
                <td
                  className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary"
                  title={formattedDate}
                >
                  {timeDistance}
                </td>

                {/* Error field */}
                <td className="px-6 py-4 text-xs font-medium text-danger max-w-[200px]" title={app.errorMsg || ''}>
                  {isFailed && app.errorMsg ? (
                    <span className="truncate block">{truncateText(app.errorMsg, 40)}</span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
