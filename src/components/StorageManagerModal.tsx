import React, { useState } from 'react';
import { StorageStats } from '../hooks/useStorageManager';

interface StorageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: StorageStats;
  onUpdateLimit: (mb: number) => void;
  onDeleteSessions: (ids: string[]) => Promise<boolean>;
  isDriveConnected: boolean;
}

export function StorageManagerModal({ 
  isOpen, 
  onClose, 
  stats, 
  onUpdateLimit,
  onDeleteSessions,
  isDriveConnected
}: StorageManagerModalProps) {
  const [customLimit, setCustomLimit] = useState<string>((stats.limitBytes / 1024 / 1024).toString());
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = () => {
    if (stats.isCritical) return 'bg-red-500';
    if (stats.isNearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const handleSaveLimit = () => {
    const mb = parseInt(customLimit, 10);
    if (mb > 0 && mb <= 15000) { // Max 15GB (Google Drive free tier limit safety)
      onUpdateLimit(mb);
    }
  };

  const handleQuickDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your oldest sessions to free up space?')) return;
    
    setIsDeleting(true);
    // Logic to fetch oldest sessions and delete them would go here
    // For now, this is a placeholder
    alert('Auto-cleanup feature coming soon. Please manually select sessions to delete.');
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Storage Management
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!isDriveConnected ? (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ You are using local browser storage. Connect Google Drive for better management and cross-device sync.
              </p>
            </div>
          ) : (
            <>
              {/* Usage Meter */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-600 dark:text-slate-400">Used Storage</span>
                  <span className={`font-medium ${stats.isCritical ? 'text-red-600' : stats.isNearLimit ? 'text-yellow-600' : 'text-slate-900 dark:text-white'}`}>
                    {formatBytes(stats.usedBytes)} / {formatBytes(stats.limitBytes)}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor()} transition-all duration-500`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
                {stats.isCritical && (
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    🚨 Critical: You are near your storage limit. Delete old conversations to continue.
                  </p>
                )}
                {stats.isNearLimit && !stats.isCritical && (
                  <p className="text-xs text-yellow-600 mt-2 font-medium">
                    ⚠️ Warning: Storage usage is high ({Math.round(stats.percentage)}%).
                  </p>
                )}
              </div>

              {/* File Count */}
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total Conversations</span>
                <span className="font-semibold text-slate-900 dark:text-white">{stats.fileCount}</span>
              </div>

              {/* Limit Setting */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Storage Limit (MB)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={customLimit}
                    onChange={(e) => setCustomLimit(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    min="10"
                    max="15000"
                  />
                  <button
                    onClick={handleSaveLimit}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Set Limit
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Maximum recommended: 15,000 MB (15 GB) for free Google Drive accounts.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={handleQuickDelete}
                  disabled={isDeleting || stats.fileCount === 0}
                  className="w-full px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Cleaning up...' : '🗑️ Auto-delete Oldest Sessions'}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
                  Or manually select sessions to delete from the history panel.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
