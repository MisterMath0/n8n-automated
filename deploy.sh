#!/bin/bash

# deploy.sh - Secure Server Management Script
# Usage: ./deploy.sh [option]

set -e

PROJECT_DIR="/root/n8n-automated"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root (skip for info mode)
check_permissions() {
    # Allow non-root access for info commands
    if [[ "$1" == "--info" || "$1" == "-i" ]]; then
        return 0
    fi
    
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root (use sudo) for deployment operations"
        info "For read-only information, use: ./deploy.sh --info"
        exit 1
    fi
}

# Navigate to project directory (flexible for info mode)
navigate_to_project() {
    # Try to find project directory
    if [ -d "$PROJECT_DIR" ]; then
        cd "$PROJECT_DIR"
        log "Working in: $(pwd)"
    elif [ -f "docker-compose.yml" ]; then
        # We're already in project directory
        log "Working in: $(pwd)"
    else
        error "Project directory not found. Please run from project root or ensure $PROJECT_DIR exists"
        exit 1
    fi
}

# Info mode - read-only status check (no sudo required)
info_mode() {
    info "📊 AutoKraft - System Information (Read-Only Mode)"
    echo ""
    
    # Basic system info
    info "🖥️  System Information:"
    echo "Date: $(date)"
    echo "User: $(whoami)"
    echo "Directory: $(pwd)"
    echo ""
    
    # Check if Docker is available
    if command -v docker &> /dev/null; then
        success "✅ Docker: Available"
        
        # Check if docker-compose is available
        if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
            success "✅ Docker Compose: Available"
            
            # Try to get container status (may fail without sudo, that's ok)
            info "🐳 Container Status:"
            if docker compose ps 2>/dev/null; then
                echo ""
            else
                warning "⚠️  Cannot access container status (requires sudo for full details)"
                echo ""
            fi
        else
            error "❌ Docker Compose: Not available"
        fi
    else
        error "❌ Docker: Not available"
    fi
    
    # Check if .env file exists
    info "📁 Configuration Files:"
    if [ -f "backend/.env" ]; then
        success "✅ backend/.env: Present"
    else
        error "❌ backend/.env: Missing"
    fi
    
    if [ -f "docker-compose.yml" ]; then
        success "✅ docker-compose.yml: Present"
    else
        error "❌ docker-compose.yml: Missing"
    fi
    
    if [ -f "deployment/nginx.conf" ]; then
        success "✅ deployment/nginx.conf: Present"
    else
        warning "⚠️  deployment/nginx.conf: Missing"
    fi
    echo ""
    
    # Test service availability (public endpoints)
    info "🌐 Service Availability Test:"
    
    local endpoints=(
        "https://autokraft.app:Main Site"
        "https://api.autokraft.app:API Endpoint"
        "https://api.autokraft.app/health:Health Check"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local url=$(echo "$endpoint_info" | cut -d: -f1-2)
        local name=$(echo "$endpoint_info" | cut -d: -f3)
        
        if curl -f -s --max-time 5 "$url" > /dev/null 2>&1; then
            success "✅ $name: Online"
        else
            error "❌ $name: Offline or unreachable"
        fi
    done
    echo ""
    
    # Security configuration check (read-only)
    info "🔒 Security Configuration (Basic Check):"
    
    if [ -f "backend/.env" ]; then
        if grep -q "SECRET_KEY=" backend/.env && ! grep -q "change-this-in-production\|CHANGE_THIS_IMMEDIATELY" backend/.env; then
            success "✅ JWT Secret: Configured"
        else
            error "❌ JWT Secret: Default or missing"
        fi
        
        if grep -q "CORS_ORIGINS=" backend/.env && ! grep -q "\*" backend/.env; then
            success "✅ CORS: Restricted"
        else
            error "❌ CORS: Permissive or misconfigured"
        fi
        
        local required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_JWT_SECRET")
        local missing_vars=0
        for var in "${required_vars[@]}"; do
            if ! grep -q "^${var}=" backend/.env || grep -q "^${var}=your_" backend/.env; then
                missing_vars=$((missing_vars + 1))
            fi
        done
        
        if [ $missing_vars -eq 0 ]; then
            success "✅ Required Environment Variables: Configured"
        else
            error "❌ Required Environment Variables: $missing_vars missing or have default values"
        fi
    else
        error "❌ Cannot check security configuration: .env file missing"
    fi
    
    if [ -f "deployment/nginx.conf" ] && grep -q "Content-Security-Policy" deployment/nginx.conf; then
        success "✅ Security Headers: Configured"
    else
        warning "⚠️  Security Headers: Not configured or nginx.conf missing"
    fi
    echo ""
    
    # Usage information
    info "💡 Usage Information:"
    echo "For deployment operations, use: sudo ./deploy.sh [option]"
    echo "For detailed help: ./deploy.sh --help"
    echo "To run security check only: sudo ./deploy.sh --security-check"
    echo ""
}

# Security validation function
security_check() {
    log "🔒 Running security validation..."
    
    # Check if .env file exists
    if [ ! -f "backend/.env" ]; then
        error "backend/.env file not found. Please create it from .env.example"
        return 1
    fi

    # Check for default/insecure values in .env
    if grep -q "change-this-in-production\|CHANGE_THIS_IMMEDIATELY\|your_.*_here" backend/.env; then
        error "Found default/placeholder values in .env file!"
        warning "Please update all placeholder values in backend/.env"
        grep -n "change-this-in-production\|CHANGE_THIS_IMMEDIATELY\|your_.*_here" backend/.env || true
        return 1
    fi

    # Check for wildcard CORS origins in production
    if grep -q "CORS_ORIGINS.*\*" backend/.env; then
        error "Wildcard CORS origins found in .env. This is insecure for production!"
        return 1
    fi

    # Validate required environment variables
    local required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_ROLE_KEY" "SUPABASE_JWT_SECRET")
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=" backend/.env || grep -q "^${var}=your_" backend/.env; then
            error "Required environment variable $var is not set or has default value"
            return 1
        fi
    done

    # Check nginx security configuration
    if [ -f "deployment/nginx.conf" ]; then
        local security_headers=("Content-Security-Policy" "Strict-Transport-Security" "X-Frame-Options")
        for header in "${security_headers[@]}"; do
            if ! grep -q "$header" deployment/nginx.conf; then
                error "Missing security header: $header in nginx.conf"
                return 1
            fi
        done
        
        if ! grep -q "server_tokens off" deployment/nginx.conf; then
            error "server_tokens should be set to 'off' in nginx.conf"
            return 1
        fi
    else
        warning "nginx.conf not found in deployment/ directory"
    fi

    # Check SSL certificates
    if [ ! -f "deployment/ssl/cert.pem" ] || [ ! -f "deployment/ssl/key.pem" ]; then
        warning "SSL certificates not found in deployment/ssl/"
        warning "Ensure you have valid SSL certificates for production"
    fi

    success "🛡️ Security validation passed!"
    return 0
}

# Enhanced deploy function with security checks
deploy() {
    log "🚀 Starting secure deployment..."
    
    # Run security validation first
    if ! security_check; then
        error "❌ Security validation failed! Deployment aborted."
        exit 1
    fi
    
    log "Building and starting containers..."
    docker compose down
    docker compose up -d --build --remove-orphans
    
    log "Waiting for services to be healthy..."
    sleep 10
    
    # Enhanced health check
    if enhanced_health_check; then
        success "✅ Secure deployment successful!"
        show_status
        log "🔒 Security features are active"
    else
        error "❌ Deployment failed!"
        docker compose logs --tail=20
        exit 1
    fi
}

# Restart function
restart() {
    log "🔄 Restarting containers..."
    docker compose restart
    
    sleep 5
    success "✅ Containers restarted!"
    show_status
}

# Enhanced update function with security
update() {
    log "📥 Pulling latest changes..."
    
    # Stash any local changes
    if git status --porcelain | grep -q .; then
        warning "Local changes detected, stashing..."
        git stash push -m "Auto-stash before update $(date)"
    fi
    
    # Pull latest changes
    git pull origin main
    
    log "🚀 Deploying updated code with security checks..."
    deploy
}

# Stop function
stop() {
    log "🛑 Stopping containers..."
    docker compose down
    success "✅ All containers stopped!"
}

# Enhanced status function
show_status() {
    log "📊 Container Status:"
    docker compose ps
    echo ""
    
    log "🌐 Service URLs:"
    echo "Frontend: https://autokraft.app"
    echo "Backend API: https://api.autokraft.app"
    echo "Health Check: https://api.autokraft.app/health"
    echo ""
    
    # Show security status
    info "🔒 Security Status:"
    if [ -f "backend/.env" ]; then
        if grep -q "SECRET_KEY=" backend/.env && ! grep -q "change-this-in-production" backend/.env; then
            echo "✅ JWT Secret: Configured"
        else
            echo "❌ JWT Secret: Default/Missing"
        fi
        
        if grep -q "CORS_ORIGINS=" backend/.env && ! grep -q "\*" backend/.env; then
            echo "✅ CORS: Restricted"
        else
            echo "❌ CORS: Permissive/Misconfigured"
        fi
    fi
    
    if [ -f "deployment/nginx.conf" ] && grep -q "Content-Security-Policy" deployment/nginx.conf; then
        echo "✅ Security Headers: Active"
    else
        echo "❌ Security Headers: Missing"
    fi
    echo ""
}

# Show logs
show_logs() {
    info "📝 Recent logs (last 50 lines):"
    docker compose logs --tail=50 -f
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up unused Docker resources..."
    docker system prune -f
    docker volume prune -f
    success "✅ Cleanup complete!"
}

# Enhanced health check with security validation
enhanced_health_check() {
    log "🏥 Running comprehensive health checks..."
    
    # Check if containers are running
    if ! docker compose ps | grep -q "Up"; then
        error "Some containers are not running!"
        docker compose ps
        return 1
    fi
    
    # Check if services respond
    local health_url="https://api.autokraft.app/health"
    if curl -f -s "$health_url" > /dev/null; then
        success "✅ Service health check passed!"
    else
        error "❌ Service health check failed!"
        return 1
    fi
    
    # Test security headers
    info "🔒 Checking security headers..."
    local headers_check=$(curl -I -s "$health_url" 2>/dev/null || echo "")
    
    if echo "$headers_check" | grep -q "Content-Security-Policy"; then
        success "✅ Security headers present"
    else
        warning "⚠️ Security headers may be missing"
    fi
    
    # Test rate limiting (basic check)
    info "🔒 Testing rate limiting..."
    local rate_limit_test=0
    for i in {1..3}; do
        if curl -f -s "$health_url" > /dev/null; then
            rate_limit_test=$((rate_limit_test + 1))
        fi
        sleep 1
    done
    
    if [ $rate_limit_test -eq 3 ]; then
        success "✅ Services responding (rate limiting may be active)"
    else
        warning "⚠️ Rate limiting may be too aggressive or services unresponsive"
    fi
    
    success "✅ Comprehensive health check completed!"
    return 0
}

# Basic health check (for backwards compatibility)
health_check() {
    enhanced_health_check
}

# Show help
show_help() {
    echo "deploy.sh - AutoKraft Secure Server Management"
    echo ""
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Deployment Options (require sudo):"
    echo "  -d    Deploy (rebuild and restart containers with security validation)"
    echo "  -r    Restart containers"
    echo "  -u    Update (pull changes and deploy with security checks)"
    echo "  -x    Stop containers"
    echo "  -s    Show status (including security status)"
    echo "  -l    Show logs (follow mode)"
    echo "  -c    Cleanup unused Docker resources"
    echo "  -h    Comprehensive health check (including security)"
    echo "  --security-check    Run security validation only"
    echo ""
    echo "Information Options (no sudo required):"
    echo "  -i, --info    Show system information and service status (read-only)"
    echo "  --help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh --info          # Check status without sudo"
    echo "  sudo ./deploy.sh -u         # Update from git and deploy (with security)"
    echo "  sudo ./deploy.sh -d         # Quick secure redeploy"
    echo "  sudo ./deploy.sh --security-check # Validate security configuration only"
    echo "  sudo ./deploy.sh -l         # View live logs"
    echo ""
    echo "Security Features:"
    echo "  ✅ Environment variable validation"
    echo "  ✅ SSL certificate checking"
    echo "  ✅ Security headers validation"
    echo "  ✅ CORS configuration checking"
    echo "  ✅ Default credentials detection"
}

# Main script logic
main() {
    # Handle info mode first (no sudo required)
    if [[ "${1:-}" == "--info" || "${1:-}" == "-i" ]]; then
        navigate_to_project
        info_mode
        return 0
    fi
    
    # All other operations require sudo
    check_permissions "$1"
    navigate_to_project
    
    case "${1:-}" in
        -d|--deploy)
            deploy
            ;;
        -r|--restart)
            restart
            ;;
        -u|--update)
            update
            ;;
        -x|--stop)
            stop
            ;;
        -s|--status)
            show_status
            ;;
        -l|--logs)
            show_logs
            ;;
        -c|--cleanup)
            cleanup
            ;;
        -h|--health)
            health_check
            ;;
        --security-check)
            security_check
            ;;
        --help|help)
            show_help
            ;;
        "")
            warning "No option provided. Use --help for usage information."
            info "For system info without sudo, use: ./deploy.sh --info"
            show_help
            exit 1
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
