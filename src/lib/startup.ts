import { recoverStuckRuns, getQualificationProcessor } from '@/lib/background-processor';
import { getRunManager } from '@/lib/qualification-run-manager';

/**
 * Application startup initialization
 * This should be called when the Next.js application starts
 */
export async function initializeApplication(): Promise<void> {
  console.log('[Startup] Initializing AI Qualifier application...');

  try {
    // Initialize the qualification processor (this also initializes the job queue)
    const processor = getQualificationProcessor();
    console.log('[Startup] Job queue initialized');

    // Initialize and start the run manager for automatic timeout handling
    const runManager = getRunManager();
    runManager.start();
    console.log('[Startup] Run manager started with automatic timeout checking');

    // Recover any stuck qualification runs using the run manager
    await runManager.recoverStuckRuns();
    console.log('[Startup] Stuck runs recovery completed');

    // Log initial queue statistics
    const stats = processor.getQueueStats();
    console.log('[Startup] Initial queue stats:', stats);

    // Log run manager statistics
    const runStats = await runManager.getStats();
    console.log('[Startup] Initial run manager stats:', runStats);

    console.log('[Startup] Application initialization completed successfully');
  } catch (error) {
    console.error('[Startup] Error during application initialization:', error);
    // Don't throw - we want the app to start even if there are issues
  }
}

/**
 * Graceful shutdown handler
 * This should be called when the application is shutting down
 */
export async function shutdownApplication(): Promise<void> {
  console.log('[Shutdown] Shutting down AI Qualifier application...');

  try {
    // Get the processor and stop the job queue
    const processor = getQualificationProcessor();
    processor.stop();
    console.log('[Shutdown] Job queue stopped');

    // Stop the run manager
    const runManager = getRunManager();
    runManager.stop();
    console.log('[Shutdown] Run manager stopped');

    console.log('[Shutdown] Application shutdown completed');
  } catch (error) {
    console.error('[Shutdown] Error during application shutdown:', error);
  }
}

// Auto-initialize on module import if we're in a server environment
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  // Use setImmediate to ensure this runs after module loading
  setImmediate(() => {
    initializeApplication().catch(console.error);
  });

  // Register shutdown handlers
  process.on('SIGTERM', () => {
    shutdownApplication().then(() => process.exit(0));
  });

  process.on('SIGINT', () => {
    shutdownApplication().then(() => process.exit(0));
  });
}