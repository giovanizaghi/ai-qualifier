#!/bin/bash

# AI Qualifier Domain Configuration and Management Script
# This script helps configure domain settings, DNS, and domain-related services

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/ai-qualifier-domain.log"

# Default values
DOMAIN_NAME="${DOMAIN_NAME:-}"
SUBDOMAIN="${SUBDOMAIN:-www}"
SERVER_IP="${SERVER_IP:-}"
DNS_PROVIDER="${DNS_PROVIDER:-manual}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-}"
ROUTE53_HOSTED_ZONE_ID="${ROUTE53_HOSTED_ZONE_ID:-}"

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

# Get public IP address
get_public_ip() {
    local ip=""
    
    # Try multiple services to get public IP
    for service in "ipinfo.io/ip" "icanhazip.com" "ipecho.net/plain" "ifconfig.me"; do
        ip=$(curl -s --max-time 5 "$service" 2>/dev/null | tr -d '\n' || true)
        if [[ -n "$ip" && "$ip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo "$ip"
            return 0
        fi
    done
    
    error "Could not determine public IP address"
    return 1
}

# Check domain DNS resolution
check_dns_resolution() {
    local domain="$1"
    local expected_ip="${2:-}"
    
    info "Checking DNS resolution for $domain..."
    
    local resolved_ip=$(dig +short "$domain" A | tail -n1)
    
    if [[ -n "$resolved_ip" ]]; then
        info "Domain $domain resolves to: $resolved_ip"
        
        if [[ -n "$expected_ip" ]]; then
            if [[ "$resolved_ip" == "$expected_ip" ]]; then
                info "✓ DNS resolution matches expected IP"
                return 0
            else
                warn "DNS resolution ($resolved_ip) does not match expected IP ($expected_ip)"
                return 1
            fi
        fi
        return 0
    else
        warn "Domain $domain does not resolve to any IP address"
        return 1
    fi
}

# Generate DNS configuration template
generate_dns_template() {
    local domain="$1"
    local ip="$2"
    
    info "Generating DNS configuration template for $domain..."
    
    cat > "/tmp/dns-config-${domain}.txt" << EOF
# DNS Configuration for ${domain}
# Add these records to your DNS provider:

# A Records
${domain}.              300  IN  A     ${ip}
www.${domain}.          300  IN  A     ${ip}

# CNAME Records (alternative to www A record)
# www.${domain}.        300  IN  CNAME ${domain}.

# MX Records (if you need email)
# ${domain}.            300  IN  MX    10 mail.${domain}.

# TXT Records
${domain}.              300  IN  TXT   "v=spf1 include:_spf.google.com ~all"
_dmarc.${domain}.       300  IN  TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@${domain}"

# CAA Records (Certificate Authority Authorization)
${domain}.              300  IN  CAA   0 issue "letsencrypt.org"
${domain}.              300  IN  CAA   0 iodef "mailto:security@${domain}"

# Security Headers (optional)
_security.${domain}.    300  IN  TXT   "v=security1; contact=mailto:security@${domain}"

EOF
    
    info "DNS template saved to /tmp/dns-config-${domain}.txt"
    cat "/tmp/dns-config-${domain}.txt"
}

# Configure Cloudflare DNS (if API token provided)
configure_cloudflare_dns() {
    local domain="$1"
    local ip="$2"
    
    if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
        warn "Cloudflare API token not provided, skipping automatic DNS configuration"
        return 1
    fi
    
    info "Configuring Cloudflare DNS for $domain..."
    
    # Get zone ID
    local zone_id=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$domain" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" | \
        jq -r '.result[0].id' 2>/dev/null || echo "null")
    
    if [[ "$zone_id" == "null" || -z "$zone_id" ]]; then
        error "Could not find Cloudflare zone for domain $domain"
        return 1
    fi
    
    info "Found Cloudflare zone ID: $zone_id"
    
    # Create/update A record for root domain
    local record_data="{\"type\":\"A\",\"name\":\"$domain\",\"content\":\"$ip\",\"ttl\":300}"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$record_data" > /dev/null
    
    # Create/update A record for www subdomain
    local www_record_data="{\"type\":\"A\",\"name\":\"www.$domain\",\"content\":\"$ip\",\"ttl\":300}"
    curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data "$www_record_data" > /dev/null
    
    info "Cloudflare DNS records created/updated"
    
    # Enable security features
    info "Enabling Cloudflare security features..."
    
    # Enable Always Use HTTPS
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$zone_id/settings/always_use_https" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":"on"}' > /dev/null
    
    # Enable HTTP Strict Transport Security
    curl -s -X PATCH "https://api.cloudflare.com/client/v4/zones/$zone_id/settings/security_header" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"value":{"strict_transport_security":{"enabled":true,"max_age":31536000,"include_subdomains":true,"preload":true}}}' > /dev/null
    
    info "Cloudflare security features enabled"
    return 0
}

# Configure AWS Route53 DNS (if zone ID provided)
configure_route53_dns() {
    local domain="$1"
    local ip="$2"
    
    if [[ -z "$ROUTE53_HOSTED_ZONE_ID" ]]; then
        warn "Route53 hosted zone ID not provided, skipping automatic DNS configuration"
        return 1
    fi
    
    if ! command -v aws &> /dev/null; then
        error "AWS CLI not installed, cannot configure Route53 DNS"
        return 1
    fi
    
    info "Configuring Route53 DNS for $domain..."
    
    # Create change batch for A records
    local change_batch=$(cat << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$domain",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "$ip"}]
            }
        },
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "www.$domain",
                "Type": "A",
                "TTL": 300,
                "ResourceRecords": [{"Value": "$ip"}]
            }
        }
    ]
}
EOF
)
    
    # Apply changes
    local change_id=$(aws route53 change-resource-record-sets \
        --hosted-zone-id "$ROUTE53_HOSTED_ZONE_ID" \
        --change-batch "$change_batch" \
        --query 'ChangeInfo.Id' \
        --output text)
    
    if [[ -n "$change_id" ]]; then
        info "Route53 DNS records updated (Change ID: $change_id)"
        
        # Wait for changes to propagate
        info "Waiting for DNS changes to propagate..."
        aws route53 wait resource-record-sets-changed --id "$change_id"
        info "DNS changes have propagated"
    else
        error "Failed to update Route53 DNS records"
        return 1
    fi
    
    return 0
}

# Test domain connectivity
test_domain_connectivity() {
    local domain="$1"
    
    info "Testing domain connectivity for $domain..."
    
    # Test HTTP redirect
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain/" 2>/dev/null || echo "000")
    info "HTTP status: $http_status"
    
    # Test HTTPS
    local https_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$domain/" 2>/dev/null || echo "000")
    info "HTTPS status: $https_status"
    
    # Test SSL certificate
    if command -v openssl &> /dev/null; then
        local ssl_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "SSL connection failed")
        info "SSL certificate info:"
        echo "$ssl_info"
    fi
    
    # Test redirect from www
    local www_redirect=$(curl -s -o /dev/null -w "%{http_code}" "https://www.$domain/" 2>/dev/null || echo "000")
    info "WWW redirect status: $www_redirect"
}

# Generate domain verification files
generate_domain_verification() {
    local domain="$1"
    
    info "Generating domain verification files..."
    
    # Create verification directory
    local verify_dir="/var/www/html/.well-known"
    mkdir -p "$verify_dir"
    
    # Generate verification token
    local verification_token=$(openssl rand -hex 32)
    echo "$verification_token" > "$verify_dir/ai-qualifier-verification.txt"
    
    # Generate robots.txt
    cat > "/var/www/html/robots.txt" << EOF
User-agent: *
Allow: /

# AI Qualifier
Sitemap: https://$domain/sitemap.xml
EOF
    
    # Generate basic sitemap
    cat > "/var/www/html/sitemap.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://$domain/</loc>
        <lastmod>$(date -Iseconds)</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://$domain/dashboard</loc>
        <lastmod>$(date -Iseconds)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://$domain/assessments</loc>
        <lastmod>$(date -Iseconds)</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>
</urlset>
EOF
    
    # Generate security.txt
    mkdir -p "/var/www/html/.well-known"
    cat > "/var/www/html/.well-known/security.txt" << EOF
Contact: mailto:security@$domain
Expires: $(date -d "+1 year" -Iseconds)
Encryption: https://$domain/.well-known/pgp-key.txt
Acknowledgments: https://$domain/security/acknowledgments
Policy: https://$domain/security/policy
Hiring: https://$domain/careers
EOF
    
    info "Domain verification files generated"
    info "Verification token: $verification_token"
    info "Access verification at: https://$domain/.well-known/ai-qualifier-verification.txt"
}

# Setup domain monitoring
setup_domain_monitoring() {
    local domain="$1"
    
    info "Setting up domain monitoring..."
    
    # Create domain monitoring script
    cat > "/usr/local/bin/monitor-domain.sh" << EOF
#!/bin/bash
# Domain monitoring script for $domain

DOMAIN="$domain"
LOG_FILE="/var/log/domain-monitor.log"
ALERT_EMAIL="${ADMIN_EMAIL:-admin@$domain}"

log() {
    echo "\$(date '+%Y-%m-%d %H:%M:%S') - \$*" >> "\$LOG_FILE"
}

check_domain() {
    local check_type="\$1"
    local expected="\$2"
    local actual="\$3"
    
    if [[ "\$actual" == "\$expected" ]]; then
        log "✓ \$check_type check passed: \$actual"
        return 0
    else
        log "✗ \$check_type check failed: expected \$expected, got \$actual"
        return 1
    fi
}

# Check HTTP redirect
HTTP_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" "http://\$DOMAIN/" 2>/dev/null || echo "000")
check_domain "HTTP redirect" "301" "\$HTTP_STATUS"

# Check HTTPS status
HTTPS_STATUS=\$(curl -s -o /dev/null -w "%{http_code}" "https://\$DOMAIN/" 2>/dev/null || echo "000")
check_domain "HTTPS" "200" "\$HTTPS_STATUS"

# Check SSL certificate expiry
if command -v openssl &> /dev/null; then
    CERT_EXPIRY=\$(echo | openssl s_client -servername "\$DOMAIN" -connect "\$DOMAIN:443" 2>/dev/null | openssl x509 -noout -checkend 2592000 2>/dev/null && echo "OK" || echo "EXPIRING")
    if [[ "\$CERT_EXPIRY" == "EXPIRING" ]]; then
        log "⚠ SSL certificate for \$DOMAIN is expiring within 30 days"
        # Send alert email if mail is configured
        if command -v mail &> /dev/null; then
            echo "SSL certificate for \$DOMAIN is expiring within 30 days" | mail -s "SSL Certificate Expiry Warning" "\$ALERT_EMAIL"
        fi
    else
        log "✓ SSL certificate is valid"
    fi
fi

# Check DNS resolution
DNS_IP=\$(dig +short "\$DOMAIN" A | tail -n1)
if [[ -n "\$DNS_IP" ]]; then
    log "✓ DNS resolution: \$DOMAIN -> \$DNS_IP"
else
    log "✗ DNS resolution failed for \$DOMAIN"
fi
EOF
    
    chmod +x "/usr/local/bin/monitor-domain.sh"
    
    # Add to cron (run every 30 minutes)
    local monitor_cron="*/30 * * * * /usr/local/bin/monitor-domain.sh"
    local monitor_cron_exists=$(crontab -l 2>/dev/null | grep -c "monitor-domain.sh" || true)
    
    if [[ $monitor_cron_exists -eq 0 ]]; then
        (crontab -l 2>/dev/null; echo "$monitor_cron") | crontab -
        info "Domain monitoring cron job added"
    fi
    
    info "Domain monitoring setup completed"
}

# Display domain summary
show_domain_summary() {
    local domain="$1"
    local ip="$2"
    
    info "Domain Configuration Summary:"
    echo "=============================="
    echo "Domain: $domain"
    echo "Server IP: $ip"
    echo "DNS Provider: $DNS_PROVIDER"
    echo ""
    
    echo "URLs to test:"
    echo "- http://$domain (should redirect to HTTPS)"
    echo "- https://$domain (main site)"
    echo "- https://www.$domain (should redirect to main domain)"
    echo ""
    
    echo "Verification files:"
    echo "- https://$domain/.well-known/ai-qualifier-verification.txt"
    echo "- https://$domain/robots.txt"
    echo "- https://$domain/sitemap.xml"
    echo "- https://$domain/.well-known/security.txt"
    echo ""
    
    echo "DNS Records (add these to your DNS provider):"
    echo "=============================================="
    cat "/tmp/dns-config-${domain}.txt" 2>/dev/null || echo "DNS template not generated"
    echo "=============================================="
    
    echo ""
    echo "Next Steps:"
    echo "1. Ensure DNS records are configured correctly"
    echo "2. Wait for DNS propagation (can take up to 48 hours)"
    echo "3. Run SSL setup: ./scripts/setup-ssl.sh -d $domain"
    echo "4. Test the domain connectivity"
    echo "5. Monitor domain status with: /usr/local/bin/monitor-domain.sh"
}

# Main function
main() {
    info "Starting AI Qualifier domain configuration..."
    
    # Validate inputs
    if [[ -z "$DOMAIN_NAME" ]]; then
        error "Domain name is required. Set DOMAIN_NAME environment variable or use -d option."
        exit 1
    fi
    
    # Get server IP if not provided
    if [[ -z "$SERVER_IP" ]]; then
        info "Detecting server public IP address..."
        SERVER_IP=$(get_public_ip)
        if [[ -z "$SERVER_IP" ]]; then
            exit 1
        fi
    fi
    
    info "Configuring domain: $DOMAIN_NAME"
    info "Server IP: $SERVER_IP"
    
    # Generate DNS template
    generate_dns_template "$DOMAIN_NAME" "$SERVER_IP"
    
    # Configure DNS automatically if provider is set up
    case "$DNS_PROVIDER" in
        "cloudflare")
            configure_cloudflare_dns "$DOMAIN_NAME" "$SERVER_IP" || warn "Automatic DNS configuration failed"
            ;;
        "route53")
            configure_route53_dns "$DOMAIN_NAME" "$SERVER_IP" || warn "Automatic DNS configuration failed"
            ;;
        "manual")
            info "Manual DNS configuration required. See template above."
            ;;
        *)
            warn "Unknown DNS provider: $DNS_PROVIDER. Using manual configuration."
            ;;
    esac
    
    # Generate domain verification files
    generate_domain_verification "$DOMAIN_NAME"
    
    # Setup domain monitoring
    setup_domain_monitoring "$DOMAIN_NAME"
    
    # Check DNS resolution (may fail if DNS not configured yet)
    check_dns_resolution "$DOMAIN_NAME" "$SERVER_IP" || warn "DNS not configured or not propagated yet"
    
    # Test domain connectivity (may fail if DNS not configured)
    test_domain_connectivity "$DOMAIN_NAME" || warn "Domain connectivity test failed (normal if DNS not configured yet)"
    
    # Show summary
    show_domain_summary "$DOMAIN_NAME" "$SERVER_IP"
    
    info "Domain configuration completed!"
}

# Help function
show_help() {
    cat << EOF
AI Qualifier Domain Configuration Script

Usage: $0 [OPTIONS]

Options:
    -h, --help                  Show this help message
    -d, --domain DOMAIN         Domain name (required)
    -i, --ip IP                 Server IP address (auto-detected if not provided)
    --dns-provider PROVIDER     DNS provider (manual, cloudflare, route53)
    --cloudflare-token TOKEN    Cloudflare API token
    --route53-zone-id ID        Route53 hosted zone ID

Environment Variables:
    DOMAIN_NAME                 Domain name
    SERVER_IP                   Server IP address
    DNS_PROVIDER                DNS provider
    CLOUDFLARE_API_TOKEN        Cloudflare API token
    ROUTE53_HOSTED_ZONE_ID      Route53 hosted zone ID
    ADMIN_EMAIL                 Admin email address

Examples:
    # Manual DNS configuration
    $0 -d example.com
    
    # With Cloudflare API
    $0 -d example.com --dns-provider cloudflare --cloudflare-token YOUR_TOKEN
    
    # With Route53
    $0 -d example.com --dns-provider route53 --route53-zone-id YOUR_ZONE_ID
    
    # Using environment variables
    DOMAIN_NAME="mysite.com" DNS_PROVIDER="cloudflare" CLOUDFLARE_API_TOKEN="token" $0

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
        -i|--ip)
            SERVER_IP="$2"
            shift 2
            ;;
        --dns-provider)
            DNS_PROVIDER="$2"
            shift 2
            ;;
        --cloudflare-token)
            CLOUDFLARE_API_TOKEN="$2"
            shift 2
            ;;
        --route53-zone-id)
            ROUTE53_HOSTED_ZONE_ID="$2"
            shift 2
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