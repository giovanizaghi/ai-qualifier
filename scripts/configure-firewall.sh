#!/bin/bash

# AI Qualifier Firewall Configuration Script
# This script configures UFW (Uncomplicated Firewall) for production security

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ai-qualifier-firewall.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

info() {
    log "INFO" "${GREEN}$*${NC}"
}

warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

error() {
    log "ERROR" "${RED}$*${NC}"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install UFW if not present
install_ufw() {
    if ! command -v ufw &> /dev/null; then
        info "Installing UFW..."
        apt-get update
        apt-get install -y ufw
    else
        info "UFW is already installed"
    fi
}

# Reset UFW to default state
reset_firewall() {
    info "Resetting UFW to default state..."
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    info "UFW reset complete"
}

# Configure basic rules
configure_basic_rules() {
    info "Configuring basic firewall rules..."
    
    # SSH access (be careful with this!)
    local ssh_port="${SSH_PORT:-22}"
    info "Allowing SSH on port $ssh_port"
    ufw allow "$ssh_port/tcp" comment "SSH access"
    
    # HTTP and HTTPS
    info "Allowing HTTP and HTTPS traffic"
    ufw allow 80/tcp comment "HTTP"
    ufw allow 443/tcp comment "HTTPS"
    
    # Application port (if running without reverse proxy)
    if [[ "${ALLOW_DIRECT_APP_ACCESS:-false}" == "true" ]]; then
        local app_port="${APP_PORT:-3000}"
        info "Allowing direct application access on port $app_port"
        ufw allow "$app_port/tcp" comment "AI Qualifier App"
    fi
}

# Configure monitoring ports
configure_monitoring() {
    info "Configuring monitoring access..."
    
    # Prometheus (internal only)
    ufw allow from 172.20.0.0/16 to any port 9090 comment "Prometheus internal"
    
    # Grafana (internal only)
    ufw allow from 172.20.0.0/16 to any port 3001 comment "Grafana internal"
    
    # Node exporter (internal only)
    ufw allow from 172.20.0.0/16 to any port 9100 comment "Node exporter internal"
    
    info "Monitoring access configured"
}

# Configure database access
configure_database() {
    info "Configuring database access..."
    
    # PostgreSQL (internal Docker network only)
    ufw allow from 172.20.0.0/16 to any port 5432 comment "PostgreSQL internal"
    
    # Redis (internal Docker network only)
    ufw allow from 172.20.0.0/16 to any port 6379 comment "Redis internal"
    
    info "Database access configured"
}

# Configure admin access restrictions
configure_admin_access() {
    if [[ -n "${ADMIN_IP_WHITELIST:-}" ]]; then
        info "Configuring admin access restrictions..."
        
        IFS=',' read -ra ADMIN_IPS <<< "$ADMIN_IP_WHITELIST"
        for ip in "${ADMIN_IPS[@]}"; do
            # Remove whitespace
            ip=$(echo "$ip" | xargs)
            
            if [[ "$ip" != "127.0.0.1" && "$ip" != "::1" ]]; then
                info "Allowing admin access from $ip"
                ufw allow from "$ip" to any port 22 comment "Admin SSH access"
                ufw allow from "$ip" to any port 443 comment "Admin HTTPS access"
            fi
        done
        
        info "Admin access restrictions configured"
    fi
}

# Configure rate limiting (requires iptables)
configure_rate_limiting() {
    info "Configuring connection rate limiting..."
    
    # Limit new SSH connections
    iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -m limit --limit 3/min --limit-burst 3 -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -j DROP
    
    # Limit HTTP connections per IP
    iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -m limit --limit 50/min --limit-burst 20 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -m limit --limit 50/min --limit-burst 20 -j ACCEPT
    
    # Save iptables rules
    if command -v iptables-save &> /dev/null; then
        iptables-save > /etc/iptables/rules.v4
    fi
    
    info "Rate limiting configured"
}

# Configure DDoS protection
configure_ddos_protection() {
    info "Configuring DDoS protection..."
    
    # Protect against SYN flood attacks
    echo 'net.ipv4.tcp_syncookies = 1' >> /etc/sysctl.conf
    echo 'net.ipv4.tcp_max_syn_backlog = 2048' >> /etc/sysctl.conf
    echo 'net.ipv4.tcp_synack_retries = 3' >> /etc/sysctl.conf
    
    # Protect against IP spoofing
    echo 'net.ipv4.conf.all.rp_filter = 1' >> /etc/sysctl.conf
    echo 'net.ipv4.conf.default.rp_filter = 1' >> /etc/sysctl.conf
    
    # Ignore ICMP ping requests
    echo 'net.ipv4.icmp_echo_ignore_all = 1' >> /etc/sysctl.conf
    
    # Ignore ICMP redirects
    echo 'net.ipv4.conf.all.accept_redirects = 0' >> /etc/sysctl.conf
    echo 'net.ipv6.conf.all.accept_redirects = 0' >> /etc/sysctl.conf
    
    # Ignore source routed packets
    echo 'net.ipv4.conf.all.accept_source_route = 0' >> /etc/sysctl.conf
    echo 'net.ipv6.conf.all.accept_source_route = 0' >> /etc/sysctl.conf
    
    # Apply sysctl settings
    sysctl -p
    
    info "DDoS protection configured"
}

# Configure logging
configure_logging() {
    info "Configuring firewall logging..."
    
    # Enable UFW logging
    ufw logging on
    
    # Configure log rotation for UFW logs
    cat > /etc/logrotate.d/ufw << EOF
/var/log/ufw.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate
    endscript
}
EOF
    
    info "Firewall logging configured"
}

# Enable fail2ban for additional protection
install_fail2ban() {
    info "Installing and configuring fail2ban..."
    
    apt-get install -y fail2ban
    
    # Configure fail2ban for SSH
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = auto

[sshd]
enabled = true
port = ${SSH_PORT:-22}
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 6

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10

[postfix]
enabled = false

[couriersmtp]
enabled = false
EOF
    
    # Start and enable fail2ban
    systemctl start fail2ban
    systemctl enable fail2ban
    
    info "fail2ban installed and configured"
}

# Display firewall status
show_status() {
    info "Current firewall status:"
    echo "===================="
    ufw status verbose
    echo "===================="
    
    if command -v fail2ban-client &> /dev/null; then
        echo ""
        info "fail2ban status:"
        echo "================"
        fail2ban-client status
        echo "================"
    fi
}

# Main function
main() {
    info "Starting AI Qualifier firewall configuration..."
    
    # Check prerequisites
    check_root
    
    # Install required packages
    install_ufw
    
    # Configure firewall
    reset_firewall
    configure_basic_rules
    configure_monitoring
    configure_database
    configure_admin_access
    
    # Advanced security features
    if [[ "${ENABLE_RATE_LIMITING:-true}" == "true" ]]; then
        configure_rate_limiting
    fi
    
    if [[ "${ENABLE_DDOS_PROTECTION:-true}" == "true" ]]; then
        configure_ddos_protection
    fi
    
    configure_logging
    
    # Install fail2ban for additional protection
    if [[ "${ENABLE_FAIL2BAN:-true}" == "true" ]]; then
        install_fail2ban
    fi
    
    # Enable UFW
    info "Enabling UFW..."
    ufw --force enable
    
    # Show final status
    show_status
    
    info "Firewall configuration completed successfully!"
    warn "IMPORTANT: Make sure you can still access the server before closing this session!"
}

# Help function
show_help() {
    cat << EOF
AI Qualifier Firewall Configuration Script

Usage: $0 [OPTIONS]

Options:
    -h, --help                 Show this help message
    --ssh-port PORT           Set SSH port (default: 22)
    --admin-ips IPS           Comma-separated list of admin IP addresses
    --allow-app-access        Allow direct access to application port
    --disable-rate-limiting   Disable connection rate limiting
    --disable-ddos-protection Disable DDoS protection
    --disable-fail2ban        Disable fail2ban installation

Environment Variables:
    SSH_PORT                  SSH port number
    ADMIN_IP_WHITELIST       Comma-separated admin IP addresses
    ALLOW_DIRECT_APP_ACCESS  Allow direct app access (true/false)
    ENABLE_RATE_LIMITING     Enable rate limiting (true/false)
    ENABLE_DDOS_PROTECTION   Enable DDoS protection (true/false)
    ENABLE_FAIL2BAN          Enable fail2ban (true/false)

Examples:
    # Basic configuration
    sudo $0
    
    # Custom SSH port with admin IPs
    sudo SSH_PORT=2222 ADMIN_IP_WHITELIST="192.168.1.100,10.0.0.50" $0
    
    # Minimal configuration without advanced features
    sudo ENABLE_RATE_LIMITING=false ENABLE_FAIL2BAN=false $0

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        --ssh-port)
            SSH_PORT="$2"
            shift 2
            ;;
        --admin-ips)
            ADMIN_IP_WHITELIST="$2"
            shift 2
            ;;
        --allow-app-access)
            ALLOW_DIRECT_APP_ACCESS="true"
            shift
            ;;
        --disable-rate-limiting)
            ENABLE_RATE_LIMITING="false"
            shift
            ;;
        --disable-ddos-protection)
            ENABLE_DDOS_PROTECTION="false"
            shift
            ;;
        --disable-fail2ban)
            ENABLE_FAIL2BAN="false"
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main