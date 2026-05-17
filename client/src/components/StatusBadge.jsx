import React from 'react';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normStatus = status?.toLowerCase();

  if (normStatus === 'success') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-success-light text-success dark:bg-success/20 dark:text-green-400">
        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        Applied
      </span>
    );
  }

  if (normStatus === 'failed') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-danger-light text-danger dark:bg-danger/20 dark:text-red-400">
        <XCircle className="w-3.5 h-3.5 mr-1" />
        Failed
      </span>
    );
  }

  if (normStatus === 'skipped') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        <Clock className="w-3.5 h-3.5 mr-1" />
        Skipped
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {status || 'Unknown'}
    </span>
  );
}
