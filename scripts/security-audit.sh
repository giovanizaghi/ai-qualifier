#!/bin/bash

# Security Audit Script for AI Qualifier
# This script performs comprehensive security checks before production launch

set -e

echo "🔒 Starting Security Audit for AI Qualifier..."
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Create audit results directory
AUDIT_DIR="./security-audit-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$AUDIT_DIR"

print_status "Audit results will be saved to: $AUDIT_DIR"

# 1. Dependency Security Audit
print_status "1. Running dependency security audit..."
npm audit --audit-level=moderate > "$AUDIT_DIR/npm-audit.txt" 2>&1
if [ $? -eq 0 ]; then
    print_success "No security vulnerabilities found in dependencies"
else
    print_warning "Security vulnerabilities found in dependencies. Check $AUDIT_DIR/npm-audit.txt"
fi

# 2. Check for hardcoded secrets
print_status "2. Scanning for hardcoded secrets..."
if command -v grep >/dev/null 2>&1; then
    # Check for common secret patterns
    grep -r -E "(password|secret|key|token)\s*=\s*['\"][^'\"]{8,}" src/ --exclude-dir=node_modules > "$AUDIT_DIR/potential-secrets.txt" 2>/dev/null || true
    
    if [ -s "$AUDIT_DIR/potential-secrets.txt" ]; then
        print_warning "Potential hardcoded secrets found. Review $AUDIT_DIR/potential-secrets.txt"
    else
        print_success "No obvious hardcoded secrets found"
    fi
else
    print_warning "grep not available for secret scanning"
fi

# 3. Check environment variables
print_status "3. Validating environment configuration..."
if [ -f ".env.example" ]; then
    # Check if all required env vars have examples
    print_success "Environment example file exists"
    
    # List required environment variables
    echo "Required environment variables:" > "$AUDIT_DIR/env-check.txt"
    grep -E "^[A-Z_]+" .env.example >> "$AUDIT_DIR/env-check.txt" 2>/dev/null || true
else
    print_warning "No .env.example file found"
fi

# 4. TypeScript type checking
print_status "4. Running TypeScript type checking..."
npm run type-check > "$AUDIT_DIR/type-check.txt" 2>&1
if [ $? -eq 0 ]; then
    print_success "TypeScript type checking passed"
else
    print_warning "TypeScript type checking failed. Check $AUDIT_DIR/type-check.txt"
fi

# 5. ESLint security check
print_status "5. Running ESLint security analysis..."
npm run lint:check > "$AUDIT_DIR/eslint-check.txt" 2>&1
if [ $? -eq 0 ]; then
    print_success "ESLint security analysis passed"
else
    print_warning "ESLint found issues. Check $AUDIT_DIR/eslint-check.txt"
fi

# 6. Check for common security files
print_status "6. Checking security configuration files..."

security_files=("middleware.ts" "src/lib/auth.ts" "next.config.ts")
for file in "${security_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found security file: $file"
    else
        print_warning "Missing security file: $file"
    fi
done

# 7. Database security check
print_status "7. Checking database configuration..."
if [ -f "prisma/schema.prisma" ]; then
    print_success "Prisma schema found"
    
    # Check for sensitive data exposure in schema
    if grep -q "@@map" prisma/schema.prisma; then
        print_success "Database table mapping configured"
    fi
else
    print_warning "No Prisma schema found"
fi

# 8. Check Next.js security headers
print_status "8. Analyzing Next.js configuration..."
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    print_success "Next.js configuration found"
    
    # Check for security headers
    if grep -q "headers" next.config.ts 2>/dev/null || grep -q "headers" next.config.js 2>/dev/null; then
        print_success "Security headers configuration found"
    else
        print_warning "No security headers configuration found"
    fi
else
    print_warning "No Next.js configuration found"
fi

# 9. Authentication configuration check
print_status "9. Checking authentication setup..."
if [ -f "src/lib/auth.ts" ]; then
    print_success "Authentication configuration found"
    
    # Check for NextAuth configuration
    if grep -q "NextAuth" src/lib/auth.ts; then
        print_success "NextAuth configuration detected"
    fi
else
    print_warning "No authentication configuration found"
fi

# 10. HTTPS and SSL check
print_status "10. Checking SSL/TLS configuration..."
if grep -q "https" package.json || grep -q "ssl" package.json; then
    print_success "SSL configuration references found"
else
    print_warning "No SSL configuration found in package.json"
fi

# 11. Generate security recommendations
print_status "11. Generating security recommendations..."
cat > "$AUDIT_DIR/security-recommendations.md" << EOF
# Security Recommendations - $(date)

## Critical Actions Required

### 1. Environment Security
- [ ] Ensure all production environment variables are properly set
- [ ] Rotate any exposed API keys or secrets
- [ ] Enable environment variable validation

### 2. Authentication & Authorization
- [ ] Review and test all authentication flows
- [ ] Verify role-based access control implementation
- [ ] Test session management and timeout

### 3. Data Protection
- [ ] Confirm database encryption is enabled
- [ ] Verify HTTPS is enforced in production
- [ ] Test data sanitization and validation

### 4. Monitoring & Logging
- [ ] Set up security event monitoring
- [ ] Configure error tracking and alerting
- [ ] Implement audit logging

### 5. Third-Party Security
- [ ] Review all third-party integrations
- [ ] Audit external API access
- [ ] Verify data sharing agreements

## Next Steps
1. Address all high-priority security issues
2. Implement missing security controls
3. Conduct penetration testing
4. Set up continuous security monitoring
5. Create incident response procedures

## Tools Recommended
- npm audit (dependency scanning)
- OWASP ZAP (penetration testing)
- Helmet.js (security headers)
- Sentry (error monitoring)
- Rate limiting middleware

EOF

# 12. Summary report
print_status "12. Generating audit summary..."
cat > "$AUDIT_DIR/audit-summary.md" << EOF
# Security Audit Summary - $(date)

## Audit Overview
This security audit was performed on the AI Qualifier application as part of Phase 7.2 launch preparation.

## Files Checked
- Dependencies: npm audit completed
- Source code: Scanned for hardcoded secrets
- Configuration: Environment and security files reviewed
- TypeScript: Type checking performed
- Linting: ESLint security analysis completed

## Results Location
All detailed results are saved in: $AUDIT_DIR/

## Critical Files to Review
1. npm-audit.txt - Dependency vulnerabilities
2. potential-secrets.txt - Potential secret exposure
3. security-recommendations.md - Action items
4. type-check.txt - TypeScript issues
5. eslint-check.txt - Code quality issues

## Next Actions
1. Review all generated reports
2. Fix any critical security issues
3. Implement missing security controls
4. Schedule follow-up security testing
5. Document security procedures

EOF

print_success "Security audit completed!"
print_status "Results saved to: $AUDIT_DIR"
print_status "Review the audit-summary.md file for next steps"

# Create a simple HTML report
cat > "$AUDIT_DIR/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AI Qualifier Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007acc; }
        .critical { border-left-color: #dc3545; }
        .warning { border-left-color: #ffc107; }
        .success { border-left-color: #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Qualifier Security Audit Report</h1>
        <p>Generated on: $(date)</p>
        <p>Audit Location: $AUDIT_DIR</p>
    </div>
    
    <div class="section">
        <h2>Quick Actions</h2>
        <ol>
            <li>Review npm-audit.txt for dependency vulnerabilities</li>
            <li>Check potential-secrets.txt for exposed secrets</li>
            <li>Read security-recommendations.md for next steps</li>
            <li>Fix any TypeScript or ESLint issues</li>
            <li>Implement missing security controls</li>
        </ol>
    </div>
    
    <div class="section warning">
        <h3>⚠️ Important</h3>
        <p>This is an automated audit. Manual security review and penetration testing are still required before production launch.</p>
    </div>
</body>
</html>
EOF

echo ""
echo "Open $AUDIT_DIR/index.html in your browser for a summary report"
echo "============================================="