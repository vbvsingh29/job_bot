import React from 'react';
import { CheckCircle2, Link as LinkIcon, LogOut } from 'lucide-react';

export default function PlatformCard({ platformName, isConnected, connectUrl, onDisconnect, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
          {children}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{platformName}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
        </div>
      </div>
      
      <div className="flex items-center w-full sm:w-auto">
        {isConnected ? (
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 size={16} />
              Connected
            </span>
            <button 
              onClick={onDisconnect}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              title="Disconnect"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <a
            href={connectUrl}
            className="inline-flex items-center justify-center w-full sm:w-auto gap-2 px-4 py-2 bg-[#185FA5] hover:bg-[#15508a] text-white text-sm font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-[#185FA5] dark:focus:ring-offset-gray-800"
          >
            <LinkIcon size={16} />
            Connect {platformName}
          </a>
        )}
      </div>
    </div>
  );
}
