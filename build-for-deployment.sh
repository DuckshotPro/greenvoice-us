#!/bin/bash

# Build script for deployment
# This script ensures the correct directory structure for deployment

set -e

echo "Starting build process for deployment..."

# Run the standard build command
echo "Running Vite build..."
npm run build

echo "Creating deployment directory structure..."

# Create the expected deployment directories
mkdir -p client/dist
mkdir -p server/public

# Copy built files to the expected locations
echo "Copying built files to client/dist (for deployment)..."
cp -r dist/public/* client/dist/

echo "Copying built files to server/public (for server static serving)..."
cp -r dist/public/* server/public/

echo "Verifying build output..."
if [ -f "client/dist/index.html" ] && [ -f "server/public/index.html" ] && [ -f "dist/index.js" ]; then
    echo "✅ Build completed successfully!"
    echo "Files ready for deployment:"
    echo "  - Frontend: client/dist/index.html"
    echo "  - Server: dist/index.js"
    echo "  - Static files: server/public/"
    ls -la client/dist/
else
    echo "❌ Build failed - missing expected files"
    exit 1
fi

echo "Build process complete!"