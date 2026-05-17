import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import PlatformBadge from './PlatformBadge';
import StatusBadge from './StatusBadge';
import { ExternalLink } from 'lucide-react';

export default function ApplicationCard({ application }) {
  const timeAgo = formatDistanceToNow(new Date(application.appliedAt), { addSuffix: true });
  const isFailed = application.status?.toLowerCase() === 'failed';

  return (
    <div
      className={`p-4 bg-surface rounded-xl border transition-all hover:shadow-sm ${
        isFailed 
          ? 'border-red-200 border-l-4 dark:border-red-900/50' 
          : 'border-border-default'
      }`}
    >
      <div className="flex justify-between items-start gap-2 mb-2">
        <div className="min-w-0">
          {application.url ? (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-text-primary hover:text-primary hover:underline flex items-center gap-1 group truncate"
            >
              <span className="truncate">{application.jobTitle}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </a>
          ) : (
            <h4 className="text-sm font-semibold text-text-primary truncate">
              {application.jobTitle}
            </h4>
          )}
          <p className="text-xs text-text-secondary truncate mt-0.5">{application.company}</p>
        </div>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">
          {timeAgo}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <PlatformBadge platform={application.platform} />
        <StatusBadge status={application.status} />
      </div>

      {isFailed && application.errorMsg && (
        <div className="mt-3 p-2 rounded-lg bg-danger-light/50 border border-danger-light dark:bg-danger/10 dark:border-danger/20">
          <p className="text-[11px] font-medium text-danger leading-relaxed">
            <span className="font-bold">Error: </span>
            {application.errorMsg}
          </p>
        </div>
      )}
    </div>
  );
}
