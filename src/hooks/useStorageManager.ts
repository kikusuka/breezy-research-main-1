import { useState, useEffect, useCallback } from 'react';
import { driveService } from '../services/googleDriveService';

export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  percentage: number;
  fileCount: number;
  isNearLimit: boolean;
  isCritical: boolean;
}

const DEFAULT_LIMIT_MB = 100; // Safe default: 100MB
const WARNING_THRESHOLD = 0.80; // 80%
const CRITICAL_THRESHOLD = 0.95; // 95%

export function useStorageManager(userId: string | null, isDriveConnected: boolean) {
  const [stats, setStats] = useState<StorageStats>({
    usedBytes: 0,
    limitBytes: DEFAULT_LIMIT_MB * 1024 * 1024,
    percentage: 0,
    fileCount: 0,
    isNearLimit: false,
    isCritical: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load limit from localStorage or use default
  const getLimit = () => {
    const saved = localStorage.getItem(`synthexis_storage_limit_${userId}`);
    return saved ? parseInt(saved, 10) : DEFAULT_LIMIT_MB * 1024 * 1024;
  };

  const [limit, setLimitState] = useState<number>(getLimit());

  // Calculate storage usage
  const calculateUsage = useCallback(async () => {
    if (!userId || !isDriveConnected) {
      // Fallback for local-only mode (estimate based on localStorage)
      const localSize = new TextEncoder().encode(localStorage.getItem(`synthexis_sessions_${userId}`) || '').length;
      const newLimit = limit || (DEFAULT_LIMIT_MB * 1024 * 1024);
      const pct = Math.min((localSize / newLimit) * 100, 100);
      
      setStats({
        usedBytes: localSize,
        limitBytes: newLimit,
        percentage: pct,
        fileCount: 0,
        isNearLimit: pct > WARNING_THRESHOLD * 100,
        isCritical: pct > CRITICAL_THRESHOLD * 100,
      });
      setLoading(false);
      return;
    }

    try {
      const files = await driveService.listAllSessions('sessions'); // Pass sessions folder ID or name
      const totalBytes = files.reduce((acc: number, file: any) => acc + (file.size || 0), 0);
      const count = files.length;
      const pct = (totalBytes / limit) * 100;

      setStats({
        usedBytes: totalBytes,
        limitBytes: limit,
        percentage: Math.min(pct, 100),
        fileCount: count,
        isNearLimit: pct > WARNING_THRESHOLD * 100,
        isCritical: pct > CRITICAL_THRESHOLD * 100,
      });
    } catch (err) {
      console.error('Failed to calculate storage:', err);
      setError('Could not fetch storage stats');
    } finally {
      setLoading(false);
    }
  }, [userId, isDriveConnected, limit]);

  // Initial load
  useEffect(() => {
    calculateUsage();
  }, [calculateUsage]);

  // Update limit
  const updateLimit = (newLimitMB: number) => {
    const bytes = newLimitMB * 1024 * 1024;
    setLimitState(bytes);
    localStorage.setItem(`synthexis_storage_limit_${userId}`, bytes.toString());
    // Recalculate immediately to update status
    calculateUsage();
  };

  // Delete specific sessions to free space
  const deleteSessions = async (sessionIds: string[]) => {
    if (!isDriveConnected) {
      // Local deletion logic would go here
      alert('Local deletion not fully implemented in this demo');
      return false;
    }

    try {
      await Promise.all(sessionIds.map(id => driveService.deleteSessionById(id)));
      await calculateUsage(); // Refresh stats
      return true;
    } catch (err) {
      console.error('Failed to delete sessions:', err);
      setError('Failed to delete sessions');
      return false;
    }
  };

  // Check if we can save a new file of estimated size
  const canSave = (estimatedSizeBytes: number) => {
    const projectedUsage = stats.usedBytes + estimatedSizeBytes;
    return projectedUsage <= stats.limitBytes;
  };

  return {
    stats,
    loading,
    error,
    updateLimit,
    deleteSessions,
    refreshUsage: calculateUsage,
    canSave,
  };
}
