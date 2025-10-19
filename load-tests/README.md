# Load Testing Configuration

This directory contains load testing scripts using k6 for the AI Qualifier application.

## Test Files

### 1. basic-load-test.js
Basic load testing for general application endpoints.
- Tests homepage and API endpoints
- Gradual ramp-up from 10 to 100 concurrent users
- Duration: ~6 minutes

**Run with:**
```bash
npm run test:load:basic
```

### 2. api-spike-test.js
Spike testing specifically for API endpoints.
- Tests API resilience under sudden load spikes
- Spikes to 200 concurrent users
- Focuses on API response times and error rates

**Run with:**
```bash
npm run test:load:spike
```

### 3. assessment-stress-test.js
Stress testing for assessment functionality.
- Simulates realistic user assessment workflows
- Tests sustained high load (up to 300 users)
- Measures assessment completion metrics

**Run with:**
```bash
npm run test:load:stress
```

## Performance Thresholds

### Response Time Targets
- API endpoints: < 500ms (95th percentile)
- Page loads: < 1000ms (95th percentile)
- Assessment operations: < 2000ms (95th percentile)

### Error Rate Targets
- General error rate: < 10%
- API error rate: < 10%
- Assessment error rate: < 20%

### Throughput Targets
- Homepage: > 100 requests/second
- API endpoints: > 50 requests/second
- Assessment flow: > 20 assessments/minute

## Test Environment Setup

1. **Start the application:**
   ```bash
   npm run build
   npm run start
   ```

2. **Ensure database is seeded:**
   ```bash
   npm run db:reset
   ```

3. **Run load tests:**
   ```bash
   # Basic load test
   npm run test:load:basic
   
   # Spike test
   npm run test:load:spike
   
   # Stress test
   npm run test:load:stress
   
   # All load tests
   npm run test:load:all
   ```

## Interpreting Results

### Key Metrics to Monitor

1. **http_req_duration**: Response time distribution
   - p(50): Median response time
   - p(95): 95th percentile response time
   - p(99): 99th percentile response time

2. **http_req_failed**: Percentage of failed requests
   - Should be < 10% under normal conditions
   - May increase under stress conditions

3. **http_reqs**: Total number of requests
   - Indicates throughput

4. **vus**: Virtual users (concurrent users)
   - Shows load level during test

### Expected Results

**Under Normal Load (< 50 users):**
- Response times: < 500ms (p95)
- Error rate: < 5%
- Memory usage: < 100MB

**Under High Load (50-100 users):**
- Response times: < 1000ms (p95)
- Error rate: < 10%
- Some performance degradation expected

**Under Stress (> 100 users):**
- Response times: < 2000ms (p95)
- Error rate: < 20%
- Graceful degradation, no crashes

## Troubleshooting

### Common Issues

1. **High Error Rates**
   - Check server logs for errors
   - Verify database connections
   - Check resource limits (CPU, memory)

2. **Slow Response Times**
   - Profile database queries
   - Check for memory leaks
   - Monitor CPU usage

3. **Connection Errors**
   - Verify server is running
   - Check network connectivity
   - Ensure firewall settings

### Optimization Tips

1. **Database Optimization**
   - Add proper indexes
   - Optimize slow queries
   - Use connection pooling

2. **Caching**
   - Implement response caching
   - Use CDN for static assets
   - Cache database queries

3. **Infrastructure**
   - Scale horizontally with load balancers
   - Use database read replicas
   - Monitor resource usage

## CI/CD Integration

Add load testing to your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
name: Load Tests
on:
  schedule:
    - cron: '0 2 * * *' # Run nightly
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Build application
        run: npm run build
      - name: Start application
        run: npm run start &
      - name: Wait for server
        run: sleep 30
      - name: Run load tests
        run: npm run test:load:basic
```

## Monitoring

For production monitoring, consider:

1. **Application Performance Monitoring (APM)**
   - New Relic, DataDog, or similar
   - Monitor real user metrics

2. **Infrastructure Monitoring**
   - Server metrics (CPU, memory, disk)
   - Database performance
   - Network latency

3. **Alerting**
   - Set up alerts for high error rates
   - Monitor response time degradation
   - Track resource utilization

## Load Testing Best Practices

1. **Test Regularly**
   - Include in CI/CD pipeline
   - Run before major releases
   - Monitor performance trends

2. **Test Realistic Scenarios**
   - Use real user data patterns
   - Test peak usage scenarios
   - Include edge cases

3. **Monitor System Resources**
   - CPU and memory usage
   - Database performance
   - Network bandwidth

4. **Set Realistic Expectations**
   - Define clear performance goals
   - Consider user experience impact
   - Plan for growth

## Results Archive

Store test results for trend analysis:
- Use k6 HTML reports
- Export metrics to monitoring systems
- Track performance over time
- Compare before/after deployments