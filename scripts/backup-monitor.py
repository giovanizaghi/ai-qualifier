#!/usr/bin/env python3
"""
AI Qualifier Backup Monitoring Service
Provides health checks, metrics collection, and status reporting for backup operations.
"""

import os
import sys
import time
import json
import logging
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import http.server
import socketserver
from threading import Thread
import signal

# Prometheus metrics
try:
    from prometheus_client import Counter, Gauge, Histogram, start_http_server, generate_latest
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    print("Warning: prometheus_client not available. Metrics collection disabled.")

# Configuration
CONFIG = {
    'backup_dir': os.getenv('BACKUP_DIR', '/backups'),
    'log_file': os.getenv('LOG_FILE', '/var/log/ai-qualifier-backup.log'),
    'metrics_port': int(os.getenv('METRICS_PORT', '8080')),
    'check_interval': int(os.getenv('CHECK_INTERVAL', '300')),  # 5 minutes
    'max_backup_age_hours': int(os.getenv('MAX_BACKUP_AGE_HOURS', '25')),  # 25 hours
    'enable_notifications': os.getenv('ENABLE_NOTIFICATIONS', 'true').lower() == 'true',
    'slack_webhook_url': os.getenv('SLACK_WEBHOOK_URL'),
    'admin_email': os.getenv('ADMIN_EMAIL'),
}

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/backup-monitor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('backup-monitor')

# Prometheus metrics
if PROMETHEUS_AVAILABLE:
    backup_success_counter = Counter('backup_operations_total', 'Total backup operations', ['type', 'status'])
    backup_duration_histogram = Histogram('backup_duration_seconds', 'Backup operation duration', ['type'])
    backup_size_gauge = Gauge('backup_size_bytes', 'Backup file size in bytes', ['type'])
    backup_age_gauge = Gauge('backup_age_hours', 'Hours since last successful backup', ['type'])
    backup_files_gauge = Gauge('backup_files_total', 'Total number of backup files', ['type'])
    backup_health_gauge = Gauge('backup_system_health', 'Backup system health status (1=healthy, 0=unhealthy)')

class BackupMonitor:
    """Main backup monitoring service class."""
    
    def __init__(self):
        self.running = True
        self.backup_status = {}
        self.last_check = None
        
    def start(self):
        """Start the monitoring service."""
        logger.info("Starting AI Qualifier Backup Monitor")
        
        # Start HTTP server for health checks
        health_thread = Thread(target=self._start_health_server, daemon=True)
        health_thread.start()
        
        # Start Prometheus metrics server
        if PROMETHEUS_AVAILABLE:
            try:
                start_http_server(CONFIG['metrics_port'])
                logger.info(f"Prometheus metrics server started on port {CONFIG['metrics_port']}")
            except Exception as e:
                logger.error(f"Failed to start Prometheus metrics server: {e}")
        
        # Main monitoring loop
        while self.running:
            try:
                self._check_backup_status()
                self._update_metrics()
                self._check_alerts()
                time.sleep(CONFIG['check_interval'])
            except KeyboardInterrupt:
                logger.info("Received shutdown signal")
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(30)  # Wait before retrying
                
    def stop(self):
        """Stop the monitoring service."""
        self.running = False
        
    def _start_health_server(self):
        """Start HTTP server for health checks."""
        class HealthHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/health':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()
                    
                    health_data = {
                        'status': 'healthy' if monitor.is_healthy() else 'unhealthy',
                        'timestamp': datetime.now().isoformat(),
                        'last_check': monitor.last_check.isoformat() if monitor.last_check else None,
                        'backup_status': monitor.backup_status
                    }
                    self.wfile.write(json.dumps(health_data, indent=2).encode())
                elif self.path == '/metrics' and PROMETHEUS_AVAILABLE:
                    self.send_response(200)
                    self.send_header('Content-type', 'text/plain')
                    self.end_headers()
                    self.wfile.write(generate_latest())
                else:
                    self.send_response(404)
                    self.end_headers()
                    
        try:
            with socketserver.TCPServer(("", 8080), HealthHandler) as httpd:
                logger.info("Health check server started on port 8080")
                httpd.serve_forever()
        except Exception as e:
            logger.error(f"Failed to start health server: {e}")
            
    def _check_backup_status(self):
        """Check the status of backup operations."""
        self.last_check = datetime.now()
        backup_dir = Path(CONFIG['backup_dir'])
        
        if not backup_dir.exists():
            logger.warning(f"Backup directory does not exist: {backup_dir}")
            return
            
        # Check for recent backups
        backup_types = ['daily', 'weekly', 'monthly']
        
        for backup_type in backup_types:
            status = self._check_backup_type(backup_dir, backup_type)
            self.backup_status[backup_type] = status
            logger.debug(f"Backup status for {backup_type}: {status}")
            
    def _check_backup_type(self, backup_dir: Path, backup_type: str) -> Dict[str, Any]:
        """Check status for a specific backup type."""
        pattern = f"*{backup_type}*.sql*"
        backup_files = list(backup_dir.glob(pattern))
        
        if not backup_files:
            return {
                'status': 'missing',
                'last_backup': None,
                'file_count': 0,
                'total_size': 0,
                'age_hours': float('inf')
            }
            
        # Find most recent backup
        latest_backup = max(backup_files, key=lambda f: f.stat().st_mtime)
        last_backup_time = datetime.fromtimestamp(latest_backup.stat().st_mtime)
        age_hours = (datetime.now() - last_backup_time).total_seconds() / 3600
        
        # Calculate total size
        total_size = sum(f.stat().st_size for f in backup_files)
        
        # Determine status
        if age_hours > CONFIG['max_backup_age_hours']:
            status = 'stale'
        else:
            status = 'healthy'
            
        return {
            'status': status,
            'last_backup': last_backup_time.isoformat(),
            'file_count': len(backup_files),
            'total_size': total_size,
            'age_hours': age_hours,
            'latest_file': str(latest_backup)
        }
        
    def _update_metrics(self):
        """Update Prometheus metrics."""
        if not PROMETHEUS_AVAILABLE:
            return
            
        try:
            # Update backup health
            overall_health = 1 if self.is_healthy() else 0
            backup_health_gauge.set(overall_health)
            
            # Update metrics for each backup type
            for backup_type, status in self.backup_status.items():
                backup_age_gauge.labels(type=backup_type).set(status['age_hours'])
                backup_files_gauge.labels(type=backup_type).set(status['file_count'])
                backup_size_gauge.labels(type=backup_type).set(status['total_size'])
                
        except Exception as e:
            logger.error(f"Error updating metrics: {e}")
            
    def _check_alerts(self):
        """Check for alert conditions and send notifications."""
        if not CONFIG['enable_notifications']:
            return
            
        alerts = []
        
        for backup_type, status in self.backup_status.items():
            if status['status'] == 'missing':
                alerts.append(f"No {backup_type} backups found")
            elif status['status'] == 'stale':
                alerts.append(f"{backup_type} backup is {status['age_hours']:.1f} hours old")
                
        if alerts:
            self._send_alerts(alerts)
            
    def _send_alerts(self, alerts: List[str]):
        """Send alert notifications."""
        message = f"AI Qualifier Backup Alerts:\n" + "\n".join(f"- {alert}" for alert in alerts)
        
        # Send Slack notification
        if CONFIG['slack_webhook_url']:
            self._send_slack_notification(message)
            
        # Send email notification
        if CONFIG['admin_email']:
            self._send_email_notification(message)
            
        logger.warning(f"Sent alerts: {alerts}")
        
    def _send_slack_notification(self, message: str):
        """Send notification to Slack."""
        try:
            import requests
            payload = {
                'text': message,
                'username': 'AI Qualifier Backup Monitor',
                'icon_emoji': ':warning:'
            }
            response = requests.post(CONFIG['slack_webhook_url'], json=payload, timeout=10)
            response.raise_for_status()
            logger.info("Slack notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
            
    def _send_email_notification(self, message: str):
        """Send email notification."""
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            msg = MIMEMultipart()
            msg['From'] = CONFIG.get('smtp_username', 'backup-monitor@ai-qualifier.com')
            msg['To'] = CONFIG['admin_email']
            msg['Subject'] = 'AI Qualifier Backup Alert'
            
            msg.attach(MIMEText(message, 'plain'))
            
            server = smtplib.SMTP(CONFIG.get('smtp_server', 'localhost'), CONFIG.get('smtp_port', 587))
            if CONFIG.get('smtp_username') and CONFIG.get('smtp_password'):
                server.starttls()
                server.login(CONFIG['smtp_username'], CONFIG['smtp_password'])
                
            server.send_message(msg)
            server.quit()
            logger.info("Email notification sent successfully")
        except Exception as e:
            logger.error(f"Failed to send email notification: {e}")
            
    def is_healthy(self) -> bool:
        """Check if the backup system is healthy."""
        if not self.backup_status:
            return False
            
        for status in self.backup_status.values():
            if status['status'] in ['missing', 'stale']:
                return False
                
        return True

# Global monitor instance
monitor = BackupMonitor()

def signal_handler(signum, frame):
    """Handle shutdown signals."""
    logger.info(f"Received signal {signum}, shutting down...")
    monitor.stop()
    sys.exit(0)

def main():
    """Main entry point."""
    # Set up signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    
    try:
        monitor.start()
    except Exception as e:
        logger.error(f"Failed to start backup monitor: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()