/**
 * Real-time Polling Fix for Qualification Results
 * 
 * Replace the useEffect polling logic in qualification-results.tsx with this enhanced version
 */

import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface QualificationRun {
  id: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalProspects: number;
  completed: number;
  results: any[];
}

export function useRealTimePolling(
  run: QualificationRun,
  setRun: (run: QualificationRun) => void,
  setPolling: (polling: boolean) => void
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompletedRef = useRef(run.completed);
  const isPollingRef = useRef(false);

  const pollForUpdates = useCallback(async () => {
    if (isPollingRef.current) {return;} // Prevent concurrent polling
    isPollingRef.current = true;

    try {
      console.log(`🔄 Polling run ${run.id} - Status: ${run.status}, Progress: ${run.completed}/${run.totalProspects}`);
      
      const response = await fetch(`/api/qualify/${run.id}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const updatedRun = data.run;

      // Log the update
      console.log(`📊 Poll result - Status: ${updatedRun.status}, Progress: ${updatedRun.completed}/${updatedRun.totalProspects}`);

      // Check for progress changes
      const progressChanged = updatedRun.completed !== lastCompletedRef.current;
      const statusChanged = updatedRun.status !== run.status;

      if (progressChanged || statusChanged) {
        console.log(`✨ Run updated - Progress: ${lastCompletedRef.current} → ${updatedRun.completed}, Status: ${run.status} → ${updatedRun.status}`);
        
        // Show progress notification
        if (progressChanged && updatedRun.status === "PROCESSING") {
          const progress = Math.round((updatedRun.completed / updatedRun.totalProspects) * 100);
          toast.info(`Processing: ${updatedRun.completed}/${updatedRun.totalProspects} prospects (${progress}%)`, {
            id: `progress-${run.id}`,
            duration: 2000,
          });
        }

        // Update state
        setRun(updatedRun);
        lastCompletedRef.current = updatedRun.completed;
      }

      // Check if we should stop polling
      if (updatedRun.status === "COMPLETED") {
        console.log(`✅ Qualification completed! Stopping polling.`);
        toast.success(`Qualification completed! ${updatedRun.totalProspects} prospects analyzed.`);
        setPolling(false);
        return;
      }

      if (updatedRun.status === "FAILED") {
        console.log(`❌ Qualification failed! Stopping polling.`);
        toast.error("Qualification failed. Please try again.");
        setPolling(false);
        return;
      }

    } catch (error) {
      console.error("❌ Polling error:", error);
      toast.error("Connection issue. Retrying...", { duration: 1000 });
    } finally {
      isPollingRef.current = false;
    }
  }, [run.id, run.status, run.completed, run.totalProspects, setRun, setPolling]);

  // Start/stop polling based on status
  useEffect(() => {
    const shouldPoll = run.status === "PENDING" || run.status === "PROCESSING";
    
    if (shouldPoll && !intervalRef.current) {
      console.log(`🚀 Starting polling for run ${run.id}`);
      
      // Poll immediately
      pollForUpdates();
      
      // Set up interval
      intervalRef.current = setInterval(pollForUpdates, 3000);
      
    } else if (!shouldPoll && intervalRef.current) {
      console.log(`🛑 Stopping polling for run ${run.id}`);
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        console.log(`🧹 Cleaning up polling for run ${run.id}`);
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [run.status, pollForUpdates]);

  // Update ref when run changes
  useEffect(() => {
    lastCompletedRef.current = run.completed;
  }, [run.completed]);
}

/**
 * HOW TO USE:
 * 
 * In qualification-results.tsx, replace the existing polling useEffect with:
 * 
 * import { useRealTimePolling } from './real-time-polling-fix';
 * 
 * // Remove the existing polling useEffect and replace with:
 * useRealTimePolling(run, setRun, setPolling);
 */