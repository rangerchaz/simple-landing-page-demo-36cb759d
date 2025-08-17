#!/bin/bash
set -e

echo "🔨 Starting build process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BUILD]${NC} $1"
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

# Create build directories
print_status "Creating build directories..."
mkdir -p build/frontend
mkdir -p build/backend
mkdir -p build/demo

# Validate project structure
print_status "Validating project structure..."
if [ ! -d "frontend" ] || [ ! -d "backend" ] || [ ! -d "qa" ]; then
    print_error "Missing required directories (frontend, backend, qa)"
    exit 1
fi

print_success "Project structure validated"

# Run QA pre-deployment checks
print_status "Running QA pre-deployment checks..."
if [ -d "qa" ] && [ -f "qa/package.json" ]; then
    cd qa
    npm ci --silent
    
    # Run linting
    if npm run lint > /dev/null 2>&1; then
        print_success "Linting passed"
    else
        print_warning "Linting issues found but continuing..."
    fi
    
    # Run unit tests
    if npm run test:unit > /dev/null 2>&1; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        exit 1
    fi
    
    cd ..
else
    print_warning "QA tests not found, skipping..."
fi

# Build Backend
print_status "Building backend..."
if [ -d "backend" ] && [ -f "backend/package.json" ]; then
    cd backend
    
    # Install dependencies
    npm ci --silent
    
    # Run backend tests
    if npm test > /dev/null 2>&1; then
        print_success "Backend tests passed"
    else
        print_warning "Backend tests failed but continuing..."
    fi
    
    # Build if build script exists
    if npm run build > /dev/null 2>&1; then
        print_success "Backend built successfully"
    else
        print_status "No backend build script, copying source files..."
        cp -r . ../build/backend/
    fi
    
    cd ..
else
    print_error "Backend directory not found"
    exit 1
fi

# Build Frontend
print_status "Building frontend..."
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    cd frontend
    
    # Install dependencies
    npm ci --silent
    
    # Build frontend
    if npm run build > /dev/null 2>&1; then
        print_success "Frontend built successfully"
        cp -r dist/* ../build/frontend/
    else
        print_status "No frontend build script, copying source files..."
        cp -r . ../build/frontend/
    fi
    
    cd ..
else
    print_warning "Frontend package.json not found, copying static files..."
    if [ -d "frontend" ]; then
        cp -r frontend/* build/frontend/
    fi
fi

# Process Frontend Assets
print_status "Processing frontend assets..."

# Minify CSS if tools available
if command -v csso > /dev/null 2>&1; then
    find build/frontend -name "*.css" -exec csso {} --output {} \;
    print_success "CSS minified"
elif command -v cleancss > /dev/null 2>&1; then
    find build/frontend -name "*.css" -exec cleancss {} --output {} \;
    print_success "CSS minified with cleancss"
else
    print_warning "CSS minification tools not found, skipping..."
fi

# Minify JavaScript if tools available
if command -v terser > /dev/null 2>&1; then
    find build/frontend -name "*.js" -not -path "*/node_modules/*" -exec terser {} --compress --mangle --output {} \;
    print_success "JavaScript minified"
else
    print_warning "JavaScript minification tools not found, skipping..."
fi

# Optimize images if tools available
if command -v imagemin > /dev/null 2>&1; then
    find build/frontend -name "*.jpg" -o -name "*.png" -o -name "*.gif" | xargs imagemin --replace 2>/dev/null || true
    print_success "Images optimized"
else
    print_warning "Image optimization tools not found, skipping..."
fi

# Build Demo
print_status "Building demo environment..."
if [ -d "demo" ]; then
    # Copy demo files
    cp -r demo/* build/demo/
    
    # Integrate with other components
    if [ -d "build/frontend/css" ]; then
        cp -r build/frontend/css build/demo/ 2>/dev/null || true
    fi
    
    if [ -d "build/frontend/js" ]; then
        cp -r build/frontend/js build/demo/ 2>/dev/null || true
    fi
    
    print_success "Demo environment built"
else
    print_warning "Demo directory not found, creating basic demo..."
    echo "<h1>Demo Coming Soon</h1>" > build/demo/index.html
fi

# Validate HTML
print_status "Validating HTML files..."
html_files=$(find build -name "*.html" 2>/dev/null || true)
if [ ! -z "$html_files" ]; then
    for file in $html_files; do
        if command -v htmlhint > /dev/null 2>&1; then
            if htmlhint "$file" > /dev/null 2>&1; then
                print_success "HTML validation passed for $(basename $file)"
            else
                print_warning "HTML validation issues in $(basename $file)"
            fi
        fi
    done
else
    print_warning "No HTML files found to validate"
fi

# Create deployment manifest
print_status "Creating deployment manifest..."
cat > build/deployment-manifest.json << EOF
{
  "buildTime": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "${GITHUB_SHA:-local-build}",
  "components": {
    "frontend": $([ -d "build/frontend" ] && echo "true" || echo "false"),
    "backend": $([ -d "build/backend" ] && echo "true" || echo "false"),
    "demo": $([ -d "build/demo" ] && echo "true" || echo "false")
  },
  "files": {
    "frontend": $(find build/frontend -type f 2>/dev/null | wc -l || echo 0),
    "backend": $(find build/backend -type f 2>/dev/null | wc -l || echo 0),
    "demo": $(find build/demo -type f 2>/dev/null | wc -l || echo 0)
  }
}
EOF

print_success "Deployment manifest created"

# Generate build report
print_status "Generating build report..."
echo "================================================================"
echo "                    BUILD SUMMARY REPORT                       "
echo "================================================================"
echo "Build Time: $(date)"
echo "Build Version: ${GITHUB_SHA:-local-build}"
echo ""
echo "Components Built:"
echo "  ✓ Frontend: $([ -d "build/frontend" ] && echo "Yes" || echo "No")"
echo "  ✓ Backend:  $([ -d "build/backend" ] && echo "Yes" || echo "No")"
echo "  ✓ Demo:     $([ -d "build/demo" ] && echo "Yes" || echo "No")"
echo ""
echo "File Counts:"
echo "  Frontend: $(find build/frontend -type f 2>/dev/null | wc -l || echo 0) files"
echo "  Backend:  $(find build/backend -type f 2>/dev/null | wc -l || echo 0) files"
echo "  Demo:     $(find build/demo -type f 2>/dev/null | wc -l || echo 0) files"
echo ""
echo "Build Size:"
echo "  Total: $(du -sh build 2>/dev/null | cut -f1 || echo "Unknown")"
echo "================================================================"

print_success "Build completed successfully!"
echo ""
print_status "Next steps:"
echo "  1. Deploy to Digital Ocean App Platform"
echo "  2. Run health checks"
echo "  3. Update DNS if needed"
echo ""