import React, { useState, useEffect } from 'react';
import { loadQuotaLimit, saveQuotaLimit, getStorageQuotaStatus, formatStorageSize, getRecommendedDeletions } from '../services/storageQuotaService';
import { googleDriveService } from '../services/googleDriveService';

interface StorageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StorageSettingsModal: React.FC<StorageSettingsModalProps> = ({ isOpen, onClose }) => {
  const [quotaLimit, setQuotaLimit] = useState<number>(loadQuotaLimit());
  const [tempLimit, setTempLimit] = useState<number>(quotaLimit);
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
      checkDriveConnection();
    }
  }, [isOpen]);

  const checkDriveConnection = async () => {
    try {
      const connected = await googleDriveService.isConnected();
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false);
    }
  };

  const loadStorageInfo = async () => {
    setLoading(true);
    try {
      const status = await getStorageQuotaStatus(tempLimit);
      setStorageStatus(status);
      
      if (status.isNearLimit) {
        const recs = await getRecommendedDeletions(tempLimit, 5);
        setRecommendations(recs);
      } else {
        setRecommendations([]);
      }
    } catch (error) {
      console.error('Error loading storage info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLimit = () => {
    saveQuotaLimit(tempLimit);
    setQuotaLimit(tempLimit);
    loadStorageInfo();
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    try {
      await googleDriveService.deleteSessionById(sessionId);
      await loadStorageInfo();
    } catch (error) {
      alert('Failed to delete session. Please try again.');
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const presetLimits = [50, 100, 250, 500, 1000];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Storage Settings
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Connection Status */}
          <div className={`p-4 rounded-lg ${
            isConnected 
              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {isConnected ? 'Google Drive Connected' : 'Google Drive Not Connected'}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {isConnected 
                    ? 'Your conversations are being saved to your Google Drive' 
                    : 'Connect Google Drive to sync your conversations across devices'}
                </p>
              </div>
            </div>
          </div>

          {/* Storage Limit Setting */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Storage Limit (MB)
              </label>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Set a limit for how much storage Synthexis can use in your Google Drive. 
                When approaching this limit, you'll be prompted to delete old conversations.
              </p>
              
              <div className="flex gap-2 mb-4">
                {presetLimits.map((limit) => (
                  <button
                    key={limit}
                    onClick={() => setTempLimit(limit)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      tempLimit === limit
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {limit >= 1000 ? `${limit / 1000}GB` : `${limit}MB`}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <input
                  type="number"
                  value={tempLimit}
                  onChange={(e) => setTempLimit(Math.max(10, parseInt(e.target.value) || 10))}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="10"
                  step="10"
                />
                <button
                  onClick={handleSaveLimit}
                  disabled={tempLimit === quotaLimit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Storage Usage Display */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : storageStatus ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Storage Used</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatStorageSize(storageStatus.usedMB)} / {formatStorageSize(storageStatus.limitMB)}
                  </span>
                </div>
                
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      storageStatus.percentageUsed >= 90
                        ? 'bg-red-500'
                        : storageStatus.percentageUsed >= storageStatus.warningThreshold
                        ? 'bg-amber-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, storageStatus.percentageUsed)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{storageStatus.percentageUsed}% used</span>
                  <span>{formatStorageSize(storageStatus.availableMB)} available</span>
                </div>

                {storageStatus.isNearLimit && (
                  <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-3">
                      ⚠️ Approaching Storage Limit
                    </h3>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                      You're using {storageStatus.percentageUsed}% of your allocated storage. 
                      Consider deleting some older or larger conversations:
                    </p>

                    {recommendations.length > 0 ? (
                      <div className="space-y-2">
                        {recommendations.map((rec) => (
                          <div
                            key={rec.id}
                            className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-800"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                {rec.title}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {rec.sizeMB} MB • {rec.reason}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteSession(rec.id)}
                              className="ml-4 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        No recommendations available. Try manually reviewing your conversations.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Unable to load storage information
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
