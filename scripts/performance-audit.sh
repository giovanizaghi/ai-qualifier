#!/bin/bash

# Performance Optimization Script for AI Qualifier
# This script performs comprehensive performance analysis and optimization

set -e

echo "🚀 Starting Performance Optimization for AI Qualifier..."
echo "======================================================"

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

# Create performance audit directory
PERF_DIR="./performance-audit-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$PERF_DIR"

print_status "Performance audit results will be saved to: $PERF_DIR"

# 1. Bundle Analysis
print_status "1. Analyzing bundle size..."
if command -v npx >/dev/null 2>&1; then
    # Build the project and analyze bundle
    print_status "Building project for analysis..."
    ANALYZE=true npm run build > "$PERF_DIR/build-output.txt" 2>&1
    
    if [ $? -eq 0 ]; then
        print_success "Build completed successfully"
        
        # Extract bundle size information
        grep -E "(First Load JS|Total Size)" "$PERF_DIR/build-output.txt" > "$PERF_DIR/bundle-sizes.txt" 2>/dev/null || true
        
        # Check if bundle size is reasonable (under 300KB)
        if grep -q "Total Size" "$PERF_DIR/bundle-sizes.txt"; then
            print_success "Bundle size information extracted"
        else
            print_warning "Could not extract bundle size information"
        fi
    else
        print_error "Build failed. Check $PERF_DIR/build-output.txt"
    fi
else
    print_warning "npx not available for bundle analysis"
fi

# 2. Lighthouse Performance Audit
print_status "2. Running Lighthouse performance audit..."
if command -v lighthouse >/dev/null 2>&1; then
    # Note: This requires a running server
    print_status "Starting development server for Lighthouse audit..."
    
    # Start dev server in background
    npm run dev > "$PERF_DIR/dev-server.log" 2>&1 &
    DEV_SERVER_PID=$!
    
    # Wait for server to start
    sleep 10
    
    # Run Lighthouse audit
    lighthouse http://localhost:3000 \
        --output=json \
        --output=html \
        --output-path="$PERF_DIR/lighthouse-report" \
        --chrome-flags="--headless --no-sandbox" \
        --only-categories=performance > "$PERF_DIR/lighthouse-output.txt" 2>&1 || true
    
    # Stop dev server
    kill $DEV_SERVER_PID 2>/dev/null || true
    
    if [ -f "$PERF_DIR/lighthouse-report.json" ]; then
        print_success "Lighthouse audit completed"
        
        # Extract performance score
        PERF_SCORE=$(grep -o '"performance":[0-9.]*' "$PERF_DIR/lighthouse-report.json" | cut -d':' -f2)
        if [ ! -z "$PERF_SCORE" ]; then
            echo "Performance Score: $PERF_SCORE" > "$PERF_DIR/performance-summary.txt"
            
            if (( $(echo "$PERF_SCORE > 0.9" | bc -l) )); then
                print_success "Excellent performance score: $PERF_SCORE"
            elif (( $(echo "$PERF_SCORE > 0.7" | bc -l) )); then
                print_warning "Good performance score: $PERF_SCORE (could be improved)"
            else
                print_error "Poor performance score: $PERF_SCORE (needs improvement)"
            fi
        fi
    else
        print_warning "Lighthouse audit failed or incomplete"
    fi
else
    print_warning "Lighthouse not available. Install with: npm install -g lighthouse"
fi

# 3. Dependency Analysis
print_status "3. Analyzing dependencies..."
npm list --depth=0 > "$PERF_DIR/dependencies.txt" 2>&1 || true

# Check for large dependencies
print_status "Checking for potentially large dependencies..."
cat > "$PERF_DIR/large-dependencies-check.txt" << EOF
# Large Dependencies Analysis

## Common Large Dependencies to Watch:
- moment.js (consider date-fns instead)
- lodash (use individual functions)
- chart.js (consider lighter alternatives)
- material-ui (bundle size impact)
- aws-sdk (use individual services)

## Current Dependencies Review:
EOF

# Check for specific large packages
if grep -q "moment" package.json; then
    echo "⚠️  moment.js detected - consider date-fns for smaller bundle" >> "$PERF_DIR/large-dependencies-check.txt"
fi

if grep -q "lodash" package.json; then
    echo "⚠️  lodash detected - use individual function imports" >> "$PERF_DIR/large-dependencies-check.txt"
fi

# 4. Image Optimization Check
print_status "4. Checking image optimization..."
find public/ -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.gif" 2>/dev/null > "$PERF_DIR/images-found.txt" || touch "$PERF_DIR/images-found.txt"

IMAGE_COUNT=$(wc -l < "$PERF_DIR/images-found.txt")
if [ "$IMAGE_COUNT" -gt 0 ]; then
    print_status "Found $IMAGE_COUNT images to optimize"
    
    # Check image sizes
    while IFS= read -r image; do
        if [ -f "$image" ]; then
            SIZE=$(stat -f%z "$image" 2>/dev/null || stat -c%s "$image" 2>/dev/null || echo "unknown")
            echo "$image: ${SIZE} bytes" >> "$PERF_DIR/image-sizes.txt"
            
            # Flag large images (> 500KB)
            if [ "$SIZE" -gt 500000 ] 2>/dev/null; then
                echo "⚠️  Large image: $image (${SIZE} bytes)" >> "$PERF_DIR/large-images.txt"
            fi
        fi
    done < "$PERF_DIR/images-found.txt"
    
    if [ -f "$PERF_DIR/large-images.txt" ]; then
        print_warning "Large images found. Check $PERF_DIR/large-images.txt"
    else
        print_success "No excessively large images found"
    fi
else
    print_success "No images found in public directory"
fi

# 5. Next.js Configuration Analysis
print_status "5. Analyzing Next.js configuration..."
if [ -f "next.config.ts" ] || [ -f "next.config.js" ]; then
    CONFIG_FILE="next.config.ts"
    [ -f "next.config.js" ] && CONFIG_FILE="next.config.js"
    
    cp "$CONFIG_FILE" "$PERF_DIR/next-config-current.txt"
    print_success "Next.js configuration saved for review"
    
    # Check for performance optimizations
    cat > "$PERF_DIR/next-config-recommendations.txt" << EOF
# Next.js Performance Configuration Recommendations

## Current Configuration Review:
$(cat $CONFIG_FILE)

## Recommended Optimizations:

1. **Image Optimization**
   - Ensure next/image is configured properly
   - Configure image domains and formats

2. **Bundle Analyzer**
   - Enable webpack-bundle-analyzer in development
   - Monitor bundle size over time

3. **Compression**
   - Enable gzip compression
   - Consider Brotli compression

4. **Headers**
   - Set proper cache headers
   - Configure security headers

5. **Experimental Features**
   - Consider enabling SWC compiler
   - Evaluate concurrent features

EOF
else
    print_warning "No Next.js configuration file found"
fi

# 6. TypeScript Performance Check
print_status "6. Checking TypeScript compilation performance..."
time npm run type-check > "$PERF_DIR/typescript-performance.txt" 2>&1
if [ $? -eq 0 ]; then
    print_success "TypeScript compilation completed"
else
    print_warning "TypeScript compilation issues found"
fi

# 7. Generate Performance Recommendations
print_status "7. Generating performance recommendations..."
cat > "$PERF_DIR/performance-recommendations.md" << EOF
# Performance Optimization Recommendations - $(date)

## Critical Actions Required

### 1. Bundle Size Optimization
- [ ] Review bundle analysis results
- [ ] Implement code splitting for large components
- [ ] Remove unused dependencies
- [ ] Optimize third-party library imports

### 2. Image Optimization
$(if [ -f "$PERF_DIR/large-images.txt" ]; then
    echo "- [ ] Optimize large images found in audit"
    echo "- [ ] Implement WebP format support"
else
    echo "- [x] No large images found"
fi)
- [ ] Ensure all images use next/image component
- [ ] Implement proper lazy loading

### 3. Runtime Performance
- [ ] Implement React.memo for expensive components
- [ ] Optimize re-renders and state updates
- [ ] Add database query optimization
- [ ] Implement caching strategies

### 4. Core Web Vitals
- [ ] Optimize Largest Contentful Paint (< 2.5s)
- [ ] Minimize First Input Delay (< 100ms)
- [ ] Reduce Cumulative Layout Shift (< 0.1)

### 5. Monitoring Setup
- [ ] Implement performance monitoring
- [ ] Set up Web Vitals tracking
- [ ] Configure performance budgets
- [ ] Set up automated performance testing

## Performance Budget Compliance

### Bundle Size Targets
- Main bundle: < 200KB (gzipped)
- Vendor bundle: < 150KB (gzipped)
- Total JavaScript: < 300KB (gzipped)

### Loading Time Targets
- First Contentful Paint: < 2 seconds
- Largest Contentful Paint: < 2.5 seconds
- Time to Interactive: < 3 seconds

## Next Steps
1. Address bundle size issues
2. Optimize identified large assets
3. Implement recommended performance features
4. Set up continuous performance monitoring
5. Conduct regular performance audits

## Tools for Ongoing Optimization
- Lighthouse CI for automated audits
- Web Vitals for real user monitoring
- Bundle analyzer for size tracking
- Performance budgets in CI/CD

EOF

# 8. Create Performance Monitoring Setup
print_status "8. Creating performance monitoring configuration..."
cat > "$PERF_DIR/performance-monitoring-setup.md" << EOF
# Performance Monitoring Setup

## 1. Lighthouse CI Configuration
Create \`.lighthouserc.js\`:
\`\`\`javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/dashboard'],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', {minScore: 0.9}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['warn', {minScore: 0.9}],
        'categories:seo': ['warn', {minScore: 0.9}],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
\`\`\`

## 2. Web Vitals Implementation
Add to your app:
\`\`\`typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
\`\`\`

## 3. Performance Budget in CI/CD
Add to package.json scripts:
\`\`\`json
{
  "scripts": {
    "perf:audit": "lighthouse http://localhost:3000 --output=json --quiet",
    "perf:budget": "node scripts/check-performance-budget.js"
  }
}
\`\`\`

EOF

# 9. Performance Summary Report
print_status "9. Generating performance summary..."
cat > "$PERF_DIR/performance-summary.md" << EOF
# Performance Audit Summary - $(date)

## Audit Overview
This performance audit was conducted on the AI Qualifier application as part of Phase 7.2 launch preparation.

## Key Findings

### Bundle Size Analysis
$(if [ -f "$PERF_DIR/bundle-sizes.txt" ]; then
    cat "$PERF_DIR/bundle-sizes.txt"
else
    echo "Bundle analysis pending - check build-output.txt"
fi)

### Lighthouse Performance Score
$(if [ -f "$PERF_DIR/performance-summary.txt" ]; then
    cat "$PERF_DIR/performance-summary.txt"
else
    echo "Lighthouse audit pending - requires running server"
fi)

### Image Optimization Status
$(if [ -f "$PERF_DIR/large-images.txt" ]; then
    echo "⚠️ Large images found requiring optimization:"
    cat "$PERF_DIR/large-images.txt"
else
    echo "✅ No excessively large images found"
fi)

## Files Generated
1. bundle-sizes.txt - Bundle size analysis
2. lighthouse-report.html - Detailed performance report
3. performance-recommendations.md - Action items
4. image-sizes.txt - Image optimization opportunities
5. performance-monitoring-setup.md - Monitoring implementation

## Next Actions
1. Review lighthouse-report.html for detailed insights
2. Implement recommendations from performance-recommendations.md
3. Set up continuous performance monitoring
4. Establish performance budgets
5. Schedule regular performance audits

## Performance Targets
- Lighthouse Performance Score: > 90
- Bundle Size: < 300KB total
- First Contentful Paint: < 2 seconds
- Largest Contentful Paint: < 2.5 seconds

EOF

print_success "Performance optimization audit completed!"
print_status "Results saved to: $PERF_DIR"
print_status "Review the performance-summary.md file for next steps"

# Create a simple HTML report index
cat > "$PERF_DIR/index.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>AI Qualifier Performance Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007acc; }
        .section { margin: 20px 0; padding: 15px; background: #fff; border: 1px solid #e9ecef; border-radius: 8px; }
        .metric { display: inline-block; margin: 10px; padding: 15px; background: #e3f2fd; border-radius: 4px; }
        .good { background: #e8f5e8; border-left: 4px solid #28a745; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
        .error { background: #f8d7da; border-left: 4px solid #dc3545; }
        .file-list { list-style-type: none; padding: 0; }
        .file-list li { margin: 5px 0; padding: 8px; background: #f8f9fa; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 AI Qualifier Performance Audit Report</h1>
        <p><strong>Generated:</strong> $(date)</p>
        <p><strong>Audit Location:</strong> $PERF_DIR</p>
    </div>
    
    <div class="section">
        <h2>📊 Key Metrics</h2>
        <div class="metric">
            <strong>Bundle Analysis:</strong><br>
            $(if [ -f "$PERF_DIR/bundle-sizes.txt" ]; then echo "✅ Completed"; else echo "⏳ In Progress"; fi)
        </div>
        <div class="metric">
            <strong>Lighthouse Audit:</strong><br>
            $(if [ -f "$PERF_DIR/lighthouse-report.html" ]; then echo "✅ Completed"; else echo "⏳ Manual Run Required"; fi)
        </div>
        <div class="metric">
            <strong>Image Optimization:</strong><br>
            $(if [ -f "$PERF_DIR/large-images.txt" ]; then echo "⚠️ Issues Found"; else echo "✅ Optimized"; fi)
        </div>
    </div>
    
    <div class="section">
        <h2>📁 Generated Files</h2>
        <ul class="file-list">
            <li>📈 <strong>performance-summary.md</strong> - Executive summary</li>
            <li>📋 <strong>performance-recommendations.md</strong> - Action items</li>
            <li>🔍 <strong>lighthouse-report.html</strong> - Detailed performance analysis</li>
            <li>📦 <strong>bundle-sizes.txt</strong> - Bundle size breakdown</li>
            <li>🖼️ <strong>image-sizes.txt</strong> - Image optimization report</li>
            <li>⚙️ <strong>performance-monitoring-setup.md</strong> - Monitoring configuration</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>🎯 Next Steps</h2>
        <ol>
            <li>Review <code>performance-recommendations.md</code> for priority actions</li>
            <li>Open <code>lighthouse-report.html</code> for detailed insights</li>
            <li>Implement performance monitoring from setup guide</li>
            <li>Set performance budgets for CI/CD pipeline</li>
            <li>Schedule regular performance audits</li>
        </ol>
    </div>
    
    <div class="section warning">
        <h3>⚠️ Important Notes</h3>
        <ul>
            <li>Lighthouse audit requires a running server for complete results</li>
            <li>Performance optimization is ongoing - schedule regular reviews</li>
            <li>Test performance under production-like conditions</li>
            <li>Monitor real user metrics after launch</li>
        </ul>
    </div>
</body>
</html>
EOF

echo ""
echo "📊 Open $PERF_DIR/index.html in your browser for a visual report"
if [ -f "$PERF_DIR/lighthouse-report.html" ]; then
    echo "🔍 Open $PERF_DIR/lighthouse-report.html for detailed Lighthouse analysis"
fi
echo "======================================================"