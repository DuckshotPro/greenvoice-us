#!/bin/bash

# Firebase Deployment Script for Invoice Platform

echo "🚀 Starting Firebase deployment process..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

# Install and build functions
echo "🔧 Building Firebase Functions..."
cd functions
npm install

if [ $? -ne 0 ]; then
    echo "❌ Functions dependencies installation failed"
    exit 1
fi

npm run build

if [ $? -ne 0 ]; then
    echo "❌ Functions build failed"
    exit 1
fi

cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "Your invoice platform is now live on Firebase!"
else
    echo "❌ Deployment failed"
    exit 1
fi