import React from 'react';

export default function PlatformBadge({ platform }) {
  const normPlatform = platform?.toLowerCase();
  
  if (normPlatform === 'linkedin') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        LinkedIn
      </span>
    );
  }

  if (normPlatform === 'naukri') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Naukri
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {platform || 'Unknown'}
    </span>
  );
}
