#!/bin/bash

# deploy.sh - Server Management Script
# Usage: ./deploy.sh [option]
# Options:
#   -d    Deploy (rebuild and restart containers)
#   -r    Restart containers
#   -u    Update (pull changes and deploy)
#   -x    Stop containers
#   -s    Show status
#   -l    Show logs

set -e

PROJECT_DIR="/root/n8n-automated"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Check if running as root
check_permissions() {
    if [ "$EUID" -ne 0 ]; then
        error "Please run as root (use sudo)"
        exit 1
    fi
}

# Navigate to project directory
navigate_to_project() {
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Project directory not found: $PROJECT_DIR"
        exit 1
    fi
    cd "$PROJECT_DIR"
    log "Working in: $(pwd)"
}

# Deploy function - rebuild and restart
deploy() {
    log "🚀 Starting deployment..."
    
    log "Building and starting containers..."
    docker compose down
    docker compose up -d --build
    
    log "Waiting for services to be healthy..."
    sleep 10
    
    # Check if services are running
    if docker compose ps | grep -q "Up"; then
        log "✅ Deployment successful!"
        show_status
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
    log "✅ Containers restarted!"
    show_status
}

# Update function - pull changes and deploy
update() {
    log "📥 Pulling latest changes..."
    
    # Stash any local changes
    if git status --porcelain | grep -q .; then
        warning "Local changes detected, stashing..."
        git stash push -m "Auto-stash before update $(date)"
    fi
    
    # Pull latest changes
    git pull origin main
    
    log "🚀 Deploying updated code..."
    deploy
}

# Stop function
stop() {
    log "🛑 Stopping containers..."
    docker compose down
    log "✅ All containers stopped!"
}

# Show status
show_status() {
    log "📊 Container Status:"
    docker compose ps
    echo ""
    
    log "🌐 Service URLs:"
    echo "Frontend: https://n8n.automizeagency.com"
    echo "Backend API: https://n8n.automizeagency.com/api"
    echo "Health Check: https://n8n.automizeagency.com/health"
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
    log "✅ Cleanup complete!"
}

# Health check
health_check() {
    log "🏥 Running health checks..."
    
    # Check if containers are running
    if ! docker compose ps | grep -q "Up"; then
        error "Some containers are not running!"
        docker compose ps
        return 1
    fi
    
    # Check if services respond
    if curl -f -s https://n8n.automizeagency.com/health > /dev/null; then
        log "✅ Health check passed!"
    else
        error "❌ Health check failed!"
        return 1
    fi
}

# Show help
show_help() {
    echo "deploy.sh - N8N Automated Server Management"
    echo ""
    echo "Usage: ./deploy.sh [option]"
    echo ""
    echo "Options:"
    echo "  -d    Deploy (rebuild and restart containers)"
    echo "  -r    Restart containers"
    echo "  -u    Update (pull changes and deploy)"
    echo "  -x    Stop containers"
    echo "  -s    Show status"
    echo "  -l    Show logs (follow mode)"
    echo "  -c    Cleanup unused Docker resources"
    echo "  -h    Health check"
    echo "  --help Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh -u    # Update from git and deploy"
    echo "  ./deploy.sh -d    # Quick redeploy"
    echo "  ./deploy.sh -l    # View live logs"
}

# Main script logic
main() {
    check_permissions
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
        --help|help)
            show_help
            ;;
        "")
            warning "No option provided. Use --help for usage information."
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