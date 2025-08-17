#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[HEALTH]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Configuration
FRONTEND_URL="${FRONTEND_URL:-https://your-domain.com}"
API_URL="${API_URL:-https://your-domain.com/api}"
DEMO_URL="${DEMO_URL:-https://demo.your-domain.com}"
MAX_RETRIES=5
RETRY_DELAY=10

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local timeout=${3:-10}
    
    print_status "Checking $url..."
    
    response=$(curl -s -w "%{http_code}" -o /tmp/response.txt --max-time $timeout "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$url is healthy (HTTP $response)"
        return 0
    else
        print_error "$url returned HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Function to check with retries
check_with_retries() {
    local url=$1
    local expected_status=${2:-200}
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        if check_endpoint "$url" "$expected_status"; then
            return 0
        fi
        
        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            print_warning "Retry $retries/$MAX_RETRIES in ${RETRY_DELAY}s..."
            sleep $RETRY_DELAY
        fi
    done
    
    print_error "Failed after $MAX_RETRIES retries"
    return 1
}

# Function to check performance
check_performance() {
    local url=$1
    local max_time=${2:-3}
    
    print_status "Checking performance for $url..."
    
    time_total=$(curl -w "%{time_total}" -s -o /dev/null --max-time 30 "$url" 2>/dev/null || echo "999")
    time_total_ms=$(echo "$time_total * 1000" | bc -l 2>/dev/null || echo "999000")
    max_time_ms=$(echo "$max_time * 1000" | bc -l)
    
    if (( $(echo "$time_total_ms < $max_time_ms" | bc -l) )); then
        print_success "Performance OK: ${time_total}s (< ${max_time}s)"
        return 0
    else
        print_warning "Performance slow: ${time_total}s (> ${max_time}s)"
        return 1
    fi
}

print_status "Starting health checks..."
echo "================================================================"
echo "                    HEALTH CHECK REPORT                        "
echo "================================================================"

# Check Frontend
echo ""
echo "🌐 FRONTEND CHECKS"
echo "----------------"
if check_with_retries "$FRONTEND_URL" "200"; then
    check_performance "$FRONTEND_URL" 3
    
    # Check for specific content
    if curl -s "$FRONTEND_URL" | grep -q "<!DOCTYPE html>" > /dev/null; then
        print_success "Frontend serves valid HTML"
    else
        print_warning "Frontend HTML may be malformed"
    fi
else
    print_error "Frontend health check failed"
    exit 1
fi

# Check API/Backend
echo ""
echo "🔧 BACKEND CHECKS"
echo "----------------"
if check_with_retries "$API_URL/health" "200"; then
    check_performance "$API_URL/health" 2
    
    # Check API response format
    api_response=$(curl -s "$API_URL/health" 2>/dev/null || echo "{}")
    if echo "$api_response" | grep -q "status" > /dev/null; then
        print_success "API returns valid health response"
    else
        print_warning "API health response format unexpected"
    fi
else
    print_error "Backend health check failed"
    exit 1
fi

# Test Contact Form Endpoint
if check_with_retries "$API_URL/contact" "405"; then  # Expect 405 for GET on POST endpoint
    print_success "Contact form endpoint is accessible"
else
    print_warning "Contact form endpoint may have issues"
fi

# Check Demo
echo ""
echo "🎯 DEMO CHECKS"
echo "-------------"
if check_with_retries "$DEMO_URL" "200"; then
    check_performance "$DEMO_URL" 3
    print_success "Demo environment is healthy"
else
    print_warning "Demo environment issues (non-critical)"
fi

# SSL Certificate Check
echo ""
echo "🔒 SSL CERTIFICATE CHECKS"
echo "------------------------"
ssl_expiry=$(echo | openssl s_client -servername $(echo $FRONTEND_URL | sed 's|https://||' | sed 's|/.*||') -connect $(echo $FRONTEND_URL | sed 's|https://||' | sed 's|/.*||'):443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | sed 's/notAfter=//' || echo "Unknown")

if [ "$ssl_expiry" != "Unknown" ]; then
    print_success "SSL Certificate valid until: $ssl_expiry"
else
    print_warning "Could not verify SSL certificate expiry"
fi

# DNS Check
echo ""
echo "🌍 DNS CHECKS"
echo "------------"
domain=$(echo $FRONTEND_URL | sed 's|https://||' | sed 's|/.*||')
ip_address=$(dig +short $domain 2>/dev/null | tail -n1 || echo "Unknown")

if [ "$ip_address" != "Unknown" ] && [ ! -z "$ip_address" ]; then
    print_success "DNS resolution: $domain -> $ip_address"
else
    print_warning "DNS resolution issues for $domain"
fi

# Security Headers Check
echo ""
echo "🛡️ SECURITY HEADERS CHECK"
echo "------------------------"
security_headers=$(curl -I -s "$FRONTEND_URL" 2>/dev/null || echo "")

if echo "$security_headers" | grep -i "strict-transport-security" > /dev/null; then
    print_success "HSTS header present"
else
    print_warning "HSTS header missing"
fi

if echo "$security_headers" | grep -i "x-frame-options\|frame-options" > /dev/null; then
    print_success "X-Frame-Options header present"
else
    print_warning "X-Frame-Options header missing"
fi

if echo "$security_headers" | grep -i "content-security-policy" > /dev/null; then
    print_success "CSP header present"
else
    print_warning "Content-Security-Policy header missing"
fi

# Final Summary
echo ""
echo "================================================================"
echo "                    HEALTH CHECK SUMMARY                       "
echo "================================================================"
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Frontend URL: $FRONTEND_URL"
echo "API URL: $API_URL"
echo "Demo URL: $DEMO_URL"
echo ""
echo "Status: ✅ All critical checks passed"
echo "Deployment is healthy and ready for traffic"
echo "================================================================"

print_success "Health checks completed successfully!"