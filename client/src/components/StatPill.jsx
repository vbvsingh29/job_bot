import React from 'react';

export default function StatPill({ icon, label, count, colorClass }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm`}>
      <span className={colorClass}>{icon}</span>
      <span className="text-gray-600 dark:text-gray-300">{label}:</span>
      <span className="text-gray-900 dark:text-white font-bold">{count}</span>
    </div>
  );
}
