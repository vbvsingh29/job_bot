import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';

export default function RunLogRow({ application }) {
  const timeAgo = formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 overflow-hidden">
        <PlatformBadge platform={application.platform} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {application.jobTitle}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {application.company}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-4">
        <StatusBadge status={application.status} />
        <span className="text-[11px] text-gray-500 dark:text-gray-500">
          {timeAgo}
        </span>
      </div>
    </div>
  );
}
