import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

// Type definitions for global metrics
declare global {
  var appMetrics: {
    httpRequests: Record<string, number>;
    auth: { success: number; failed: number };
    qualifications: { started: number; completed: number; failed: number };
    users: { active: number };
  } | undefined;
}

// Metrics endpoint for Prometheus scraping
export async function GET(request: NextRequest) {
  if (!env.METRICS_ENDPOINT_ENABLED) {
    return NextResponse.json(
      { error: 'Metrics endpoint is disabled' },
      { status: 404 }
    );
  }

  try {
    // Simple authentication check for metrics endpoint
    const authHeader = request.headers.get('authorization');
    const metricsToken = process.env.METRICS_TOKEN;
    
    if (metricsToken && (!authHeader || authHeader !== `Bearer ${metricsToken}`)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Application metrics in Prometheus format
    const metrics = [
      // Node.js process metrics
      `# HELP nodejs_version_info Node.js version info`,
      `# TYPE nodejs_version_info gauge`,
      `nodejs_version_info{version="${process.version}"} 1`,
      
      `# HELP process_uptime_seconds Process uptime in seconds`,
      `# TYPE process_uptime_seconds counter`,
      `process_uptime_seconds ${process.uptime()}`,
      
      // Memory metrics
      `# HELP process_resident_memory_bytes Resident memory size in bytes`,
      `# TYPE process_resident_memory_bytes gauge`,
      `process_resident_memory_bytes ${process.memoryUsage().rss}`,
      
      `# HELP process_heap_bytes Process heap size in bytes`,
      `# TYPE process_heap_bytes gauge`,
      `process_heap_bytes ${process.memoryUsage().heapUsed}`,
      
      `# HELP process_heap_total_bytes Process heap total size in bytes`,
      `# TYPE process_heap_total_bytes gauge`,
      `process_heap_total_bytes ${process.memoryUsage().heapTotal}`,
      
      `# HELP process_external_memory_bytes Process external memory in bytes`,
      `# TYPE process_external_memory_bytes gauge`,
      `process_external_memory_bytes ${process.memoryUsage().external}`,
      
      // Application-specific metrics
      `# HELP ai_qualifier_environment Application environment`,
      `# TYPE ai_qualifier_environment gauge`,
      `ai_qualifier_environment{env="${env.APP_ENV}",version="${process.env.npm_package_version || '1.0.0'}"} 1`,
      
      // Feature flags as metrics
      `# HELP ai_qualifier_feature_enabled Feature flag status`,
      `# TYPE ai_qualifier_feature_enabled gauge`,
      `ai_qualifier_feature_enabled{feature="ai_tutoring"} ${env.FEATURE_AI_TUTORING ? 1 : 0}`,
      `ai_qualifier_feature_enabled{feature="advanced_analytics"} ${env.FEATURE_ADVANCED_ANALYTICS ? 1 : 0}`,
      `ai_qualifier_feature_enabled{feature="payment_processing"} ${env.FEATURE_PAYMENT_PROCESSING ? 1 : 0}`,
      `ai_qualifier_feature_enabled{feature="social_login"} ${env.FEATURE_SOCIAL_LOGIN ? 1 : 0}`,
      
      // Configuration metrics
      `# HELP ai_qualifier_rate_limit_config Rate limiting configuration`,
      `# TYPE ai_qualifier_rate_limit_config gauge`,
      `ai_qualifier_rate_limit_config{type="max_requests"} ${env.RATE_LIMIT_MAX_REQUESTS}`,
      `ai_qualifier_rate_limit_config{type="window_ms"} ${env.RATE_LIMIT_WINDOW_MS}`,
      
      // Database configuration
      `# HELP ai_qualifier_db_config Database configuration`,
      `# TYPE ai_qualifier_db_config gauge`,
      `ai_qualifier_db_config{type="connection_limit"} ${env.DATABASE_CONNECTION_LIMIT}`,
      `ai_qualifier_db_config{type="pool_timeout_ms"} ${env.DATABASE_POOL_TIMEOUT}`,
      
      // Performance thresholds
      `# HELP ai_qualifier_threshold_config Performance threshold configuration`,
      `# TYPE ai_qualifier_threshold_config gauge`,
      `ai_qualifier_threshold_config{type="response_time_warning_ms"} ${env.RESPONSE_TIME_THRESHOLD_WARNING}`,
      `ai_qualifier_threshold_config{type="response_time_error_ms"} ${env.RESPONSE_TIME_THRESHOLD_ERROR}`,
      `ai_qualifier_threshold_config{type="memory_warning_mb"} ${env.MEMORY_USAGE_THRESHOLD_WARNING}`,
      `ai_qualifier_threshold_config{type="memory_error_mb"} ${env.MEMORY_USAGE_THRESHOLD_ERROR}`,
      `ai_qualifier_threshold_config{type="db_query_warning_ms"} ${env.DB_QUERY_THRESHOLD_WARNING}`,
      `ai_qualifier_threshold_config{type="db_query_error_ms"} ${env.DB_QUERY_THRESHOLD_ERROR}`,
      
      // AI service availability (this would be updated by middleware)
      `# HELP ai_service_availability AI service availability status`,
      `# TYPE ai_service_availability gauge`,
      `ai_service_availability{service="openai"} 1`, // This should be dynamically updated
      
      // Health check status
      `# HELP ai_qualifier_health_status Application health status`,
      `# TYPE ai_qualifier_health_status gauge`,
      `ai_qualifier_health_status{component="app"} 1`,
      
      // Add timestamp
      `# HELP ai_qualifier_metrics_last_updated_timestamp_seconds Timestamp of last metrics update`,
      `# TYPE ai_qualifier_metrics_last_updated_timestamp_seconds gauge`,
      `ai_qualifier_metrics_last_updated_timestamp_seconds ${Math.floor(Date.now() / 1000)}`,
    ];

    // Add custom business metrics (these would be collected from your application state)
    if (globalThis.appMetrics) {
      const appMetrics = globalThis.appMetrics;
      
      // HTTP request metrics
      if (appMetrics.httpRequests) {
        metrics.push(
          `# HELP http_requests_total Total number of HTTP requests`,
          `# TYPE http_requests_total counter`,
          ...Object.entries(appMetrics.httpRequests).map(([key, value]) => 
            `http_requests_total{${key}} ${value}`
          )
        );
      }
      
      // Authentication metrics
      if (appMetrics.auth) {
        metrics.push(
          `# HELP auth_attempts_total Total authentication attempts`,
          `# TYPE auth_attempts_total counter`,
          `auth_attempts_total{status="success"} ${appMetrics.auth.success || 0}`,
          `auth_attempts_total{status="failed"} ${appMetrics.auth.failed || 0}`
        );
      }
      
      // Qualification metrics
      if (appMetrics.qualifications) {
        metrics.push(
          `# HELP qualifications_total Total qualifications`,
          `# TYPE qualifications_total counter`,
          `qualifications_total{status="started"} ${appMetrics.qualifications.started || 0}`,
          `qualifications_total{status="completed"} ${appMetrics.qualifications.completed || 0}`,
          `qualifications_total{status="failed"} ${appMetrics.qualifications.failed || 0}`
        );
      }
      
      // Active users
      if (appMetrics.users) {
        metrics.push(
          `# HELP active_users_count Number of active users`,
          `# TYPE active_users_count gauge`,
          `active_users_count ${appMetrics.users.active || 0}`
        );
      }
    }

    const metricsText = metrics.join('\n') + '\n';

    return new Response(metricsText, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Metrics endpoint failed:', error);
    
    return NextResponse.json(
      {
        error: 'Metrics collection failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Initialize global metrics object if it doesn't exist
if (typeof globalThis.appMetrics === 'undefined') {
  globalThis.appMetrics = {
    httpRequests: {},
    auth: { success: 0, failed: 0 },
    qualifications: { started: 0, completed: 0, failed: 0 },
    users: { active: 0 },
  };
}