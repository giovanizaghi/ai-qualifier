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
      // Initialize the new background processing system
      const { initializeApplication } = await import('./lib/startup');
      await initializeApplication();
      
      console.log('[Instrumentation] ✅ Background processing system initialized');
    } catch (error) {
      console.error('[Instrumentation] ❌ Error during initialization:', error);
      // Don't throw - let the server continue starting
    }
    
    console.log('[Instrumentation] Server initialization complete');
  }
}
