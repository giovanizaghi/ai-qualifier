#!/bin/bash

# AI Qualifier SSL Certificate Setup Script
# This script sets up SSL certificates using Let's Encrypt with Certbot

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ai-qualifier-ssl.log"

# Default values
DOMAIN_NAME="${DOMAIN_NAME:-ai-qualifier.com}"
EMAIL="${ADMIN_EMAIL:-admin@ai-qualifier.com}"
WEBROOT_PATH="${WEBROOT_PATH:-/var/www/certbot}"
NGINX_CONFIG_PATH="${NGINX_CONFIG_PATH:-/etc/nginx}"
CERT_PATH="${CERT_PATH:-/etc/letsencrypt/live}"

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

# Install certbot if not present
install_certbot() {
    if ! command -v certbot &> /dev/null; then
        info "Installing Certbot..."
        
        # Install snapd if not present
        if ! command -v snap &> /dev/null; then
            apt-get update
            apt-get install -y snapd
        fi
        
        # Install certbot via snap
        snap install core
        snap refresh core
        snap install --classic certbot
        
        # Create symlink
        ln -sf /snap/bin/certbot /usr/bin/certbot
        
        info "Certbot installed successfully"
    else
        info "Certbot is already installed"
    fi
}

# Create webroot directory
setup_webroot() {
    info "Setting up webroot directory..."
    
    mkdir -p "$WEBROOT_PATH"
    chown -R www-data:www-data "$WEBROOT_PATH"
    chmod -R 755 "$WEBROOT_PATH"
    
    info "Webroot directory created at $WEBROOT_PATH"
}

# Generate DH parameters
generate_dhparam() {
    local dhparam_file="/etc/ssl/certs/dhparam.pem"
    
    if [[ ! -f "$dhparam_file" ]]; then
        info "Generating DH parameters (this may take a while)..."
        openssl dhparam -out "$dhparam_file" 2048
        chmod 600 "$dhparam_file"
        info "DH parameters generated"
    else
        info "DH parameters already exist"
    fi
}

# Create initial Nginx configuration for ACME challenge
create_initial_nginx_config() {
    info "Creating initial Nginx configuration for ACME challenge..."
    
    cat > "/etc/nginx/sites-available/ai-qualifier-initial" << EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};
    
    # ACME challenge location
    location /.well-known/acme-challenge/ {
        root ${WEBROOT_PATH};
        try_files \$uri =404;
    }
    
    # Temporary placeholder for other requests
    location / {
        return 200 'AI Qualifier SSL Setup in Progress';
        add_header Content-Type text/plain;
    }
}
EOF
    
    # Enable the site
    ln -sf "/etc/nginx/sites-available/ai-qualifier-initial" "/etc/nginx/sites-enabled/"
    
    # Test and reload Nginx
    nginx -t
    systemctl reload nginx
    
    info "Initial Nginx configuration created and loaded"
}

# Obtain SSL certificate
obtain_certificate() {
    info "Obtaining SSL certificate for $DOMAIN_NAME..."
    
    # Check if certificate already exists
    if [[ -d "$CERT_PATH/$DOMAIN_NAME" ]]; then
        warn "Certificate already exists for $DOMAIN_NAME"
        read -p "Do you want to renew it? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Skipping certificate generation"
            return 0
        fi
    fi
    
    # Obtain certificate using webroot method
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT_PATH" \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --non-interactive \
        -d "$DOMAIN_NAME" \
        -d "www.$DOMAIN_NAME"
    
    if [[ $? -eq 0 ]]; then
        info "SSL certificate obtained successfully"
    else
        error "Failed to obtain SSL certificate"
        exit 1
    fi
}

# Set up certificate auto-renewal
setup_auto_renewal() {
    info "Setting up automatic certificate renewal..."
    
    # Create renewal hook script
    cat > "/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh" << 'EOF'
#!/bin/bash
# Reload Nginx after certificate renewal
systemctl reload nginx
EOF
    
    chmod +x "/etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh"
    
    # Test renewal
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        info "Certificate auto-renewal test successful"
    else
        warn "Certificate auto-renewal test failed"
    fi
    
    # Add cron job for renewal (certbot usually installs this automatically)
    local cron_job="0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'systemctl reload nginx'"
    local cron_exists=$(crontab -l 2>/dev/null | grep -c "certbot renew" || true)
    
    if [[ $cron_exists -eq 0 ]]; then
        (crontab -l 2>/dev/null; echo "$cron_job") | crontab -
        info "Auto-renewal cron job added"
    else
        info "Auto-renewal cron job already exists"
    fi
}

# Create SSL configuration files
create_ssl_config() {
    info "Creating SSL configuration files..."
    
    # Copy our SSL configuration
    cp "$SCRIPT_DIR/../config/nginx-ssl.conf" "/etc/nginx/ssl.conf"
    
    # Update certificate paths in SSL config
    sed -i "s|/etc/ssl/certs/ai-qualifier.crt|$CERT_PATH/$DOMAIN_NAME/fullchain.pem|g" "/etc/nginx/ssl.conf"
    sed -i "s|/etc/ssl/private/ai-qualifier.key|$CERT_PATH/$DOMAIN_NAME/privkey.pem|g" "/etc/nginx/ssl.conf"
    sed -i "s|/etc/ssl/certs/ca-bundle.crt|$CERT_PATH/$DOMAIN_NAME/chain.pem|g" "/etc/nginx/ssl.conf"
    
    info "SSL configuration created"
}

# Deploy production Nginx configuration
deploy_nginx_config() {
    info "Deploying production Nginx configuration..."
    
    # Copy site configuration
    cp "$SCRIPT_DIR/../config/nginx-site.conf" "/etc/nginx/sites-available/ai-qualifier"
    
    # Replace domain placeholders
    sed -i "s/\${DOMAIN_NAME}/$DOMAIN_NAME/g" "/etc/nginx/sites-available/ai-qualifier"
    
    # Disable initial configuration
    rm -f "/etc/nginx/sites-enabled/ai-qualifier-initial"
    
    # Enable production configuration
    ln -sf "/etc/nginx/sites-available/ai-qualifier" "/etc/nginx/sites-enabled/"
    
    # Test configuration
    nginx -t
    
    if [[ $? -eq 0 ]]; then
        # Reload Nginx
        systemctl reload nginx
        info "Production Nginx configuration deployed successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Verify SSL setup
verify_ssl() {
    info "Verifying SSL setup..."
    
    # Wait a moment for Nginx to reload
    sleep 2
    
    # Check certificate
    local cert_info=$(echo | openssl s_client -servername "$DOMAIN_NAME" -connect "$DOMAIN_NAME:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    
    if [[ -n "$cert_info" ]]; then
        info "SSL certificate is accessible"
        
        # Check expiration
        local expiry_date=$(echo "$cert_info" | grep "Not After" | cut -d: -f2- | xargs)
        info "Certificate expires: $expiry_date"
        
        # Check if certificate is valid for domain
        local cert_domains=$(echo "$cert_info" | grep -A1 "Subject Alternative Name" | grep -o "DNS:[^,]*" | cut -d: -f2 | tr '\n' ' ')
        info "Certificate valid for domains: $cert_domains"
        
    else
        warn "Could not verify SSL certificate (this is normal if domain doesn't point to this server yet)"
    fi
    
    # Test HTTPS redirect
    local redirect_test=$(curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN_NAME/" 2>/dev/null || echo "000")
    
    if [[ "$redirect_test" == "301" ]]; then
        info "HTTP to HTTPS redirect is working"
    else
        warn "HTTP to HTTPS redirect test failed (HTTP status: $redirect_test)"
    fi
}

# Security hardening
security_hardening() {
    info "Applying security hardening..."
    
    # Set proper permissions on certificate files
    chmod 600 "$CERT_PATH/$DOMAIN_NAME/privkey.pem"
    chmod 644 "$CERT_PATH/$DOMAIN_NAME/fullchain.pem"
    chmod 644 "$CERT_PATH/$DOMAIN_NAME/chain.pem"
    
    # Create backup of certificates
    local backup_dir="/etc/ssl/backups/$(date +%Y%m%d)"
    mkdir -p "$backup_dir"
    cp -r "$CERT_PATH/$DOMAIN_NAME" "$backup_dir/"
    
    info "Certificate backup created in $backup_dir"
    
    # Set up certificate monitoring
    cat > "/usr/local/bin/check-ssl-expiry.sh" << 'EOF'
#!/bin/bash
# Check SSL certificate expiry and send alerts

DOMAIN="$1"
THRESHOLD_DAYS="${2:-30}"
EMAIL="${3:-admin@ai-qualifier.com}"

if [[ -z "$DOMAIN" ]]; then
    echo "Usage: $0 <domain> [threshold_days] [email]"
    exit 1
fi

EXPIRY_DATE=$(openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/cert.pem" -noout -enddate | cut -d= -f2)
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))

if [[ $DAYS_UNTIL_EXPIRY -le $THRESHOLD_DAYS ]]; then
    echo "WARNING: SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days ($EXPIRY_DATE)"
    
    # Send email alert if mail is configured
    if command -v mail &> /dev/null; then
        echo "SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days ($EXPIRY_DATE)" | \
        mail -s "SSL Certificate Expiry Warning - $DOMAIN" "$EMAIL"
    fi
    
    exit 1
else
    echo "SSL certificate for $DOMAIN is valid for $DAYS_UNTIL_EXPIRY more days"
    exit 0
fi
EOF
    
    chmod +x "/usr/local/bin/check-ssl-expiry.sh"
    
    # Add SSL monitoring to cron
    local ssl_check_cron="0 6 * * * /usr/local/bin/check-ssl-expiry.sh $DOMAIN 30 $EMAIL"
    local ssl_cron_exists=$(crontab -l 2>/dev/null | grep -c "check-ssl-expiry" || true)
    
    if [[ $ssl_cron_exists -eq 0 ]]; then
        (crontab -l 2>/dev/null; echo "$ssl_check_cron") | crontab -
        info "SSL monitoring cron job added"
    fi
    
    info "Security hardening completed"
}

# Display SSL information
show_ssl_info() {
    info "SSL Setup Summary:"
    echo "==================="
    echo "Domain: $DOMAIN_NAME"
    echo "Certificate Path: $CERT_PATH/$DOMAIN_NAME"
    echo "Webroot Path: $WEBROOT_PATH"
    echo "Nginx Config: /etc/nginx/sites-available/ai-qualifier"
    echo ""
    
    if [[ -f "$CERT_PATH/$DOMAIN_NAME/cert.pem" ]]; then
        echo "Certificate Information:"
        openssl x509 -in "$CERT_PATH/$DOMAIN_NAME/cert.pem" -noout -text | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
    fi
    
    echo ""
    echo "Auto-renewal Status:"
    systemctl is-active certbot.timer || echo "Certbot timer not active"
    
    echo ""
    echo "Next Steps:"
    echo "1. Update your DNS to point $DOMAIN_NAME to this server"
    echo "2. Test your site at https://$DOMAIN_NAME"
    echo "3. Monitor certificate expiry and renewal"
    echo "==================="
}

# Main function
main() {
    info "Starting AI Qualifier SSL setup for domain: $DOMAIN_NAME"
    
    # Check prerequisites
    check_root
    
    # Install required packages
    install_certbot
    
    # Set up directories and configurations
    setup_webroot
    generate_dhparam
    
    # Initial Nginx configuration for ACME challenge
    create_initial_nginx_config
    
    # Obtain SSL certificate
    obtain_certificate
    
    # Set up auto-renewal
    setup_auto_renewal
    
    # Create SSL configuration
    create_ssl_config
    
    # Deploy production configuration
    deploy_nginx_config
    
    # Security hardening
    security_hardening
    
    # Verify setup
    verify_ssl
    
    # Show summary
    show_ssl_info
    
    info "SSL setup completed successfully!"
}

# Help function
show_help() {
    cat << EOF
AI Qualifier SSL Certificate Setup Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -d, --domain DOMAIN     Domain name (default: ai-qualifier.com)
    -e, --email EMAIL       Email for Let's Encrypt (default: admin@ai-qualifier.com)
    --webroot PATH          Webroot path (default: /var/www/certbot)
    --staging               Use Let's Encrypt staging server for testing

Environment Variables:
    DOMAIN_NAME            Domain name
    ADMIN_EMAIL            Admin email address
    WEBROOT_PATH           Webroot directory path
    NGINX_CONFIG_PATH      Nginx configuration directory
    CERT_PATH              Certificate storage path

Examples:
    # Basic setup
    sudo $0 -d example.com -e admin@example.com
    
    # Test with staging server
    sudo $0 -d example.com -e admin@example.com --staging
    
    # Using environment variables
    sudo DOMAIN_NAME="mysite.com" ADMIN_EMAIL="me@mysite.com" $0

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        --webroot)
            WEBROOT_PATH="$2"
            shift 2
            ;;
        --staging)
            CERTBOT_STAGING="--staging"
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [[ -z "$DOMAIN_NAME" ]]; then
    error "Domain name is required. Use -d option or set DOMAIN_NAME environment variable."
    exit 1
fi

if [[ -z "$EMAIL" ]]; then
    error "Email is required. Use -e option or set ADMIN_EMAIL environment variable."
    exit 1
fi

# Run main function
main