/**
 * Instrumentation hook for Next.js
 * This runs once when the server starts (before any requests)
 * 
 * Documentation: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (typeof window === 'undefined') {
    console.log('[Instrumentation] Server starting...');
    
    try {
      // Import recovery function
      const { recoverStuckRuns } = await import('./lib/background-recovery');
      
      // Recover stuck runs from previous server sessions
      // Using 5 minutes timeout - more aggressive for development
      console.log('[Instrumentation] Checking for stuck qualification runs...');
      const result = await recoverStuckRuns(5); // 5 minutes timeout instead of 10
      
      if (result.recovered > 0) {
        console.log(`[Instrumentation] ✅ Recovered ${result.recovered} stuck runs`);
        result.runs.forEach((run: any) => {
          console.log(`  - Run ${run.id}: ${run.completed}/${run.totalProspects} completed (status: ${run.status} → FAILED)`);
        });
      } else {
        console.log('[Instrumentation] ✅ No stuck runs found');
      }
    } catch (error) {
      console.error('[Instrumentation] ❌ Error during recovery:', error);
      // Don't throw - let the server continue starting
    }
    
    console.log('[Instrumentation] Server initialization complete');
  }
}
