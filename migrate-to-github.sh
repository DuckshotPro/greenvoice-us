#!/bin/bash

# Migration script from Replit to GitHub to Firebase

echo "🚀 Starting migration from Replit to GitHub..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing git repository..."
    git init
fi

# Add all files to git
echo "📦 Adding files to git..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit: Invoice platform migration from Replit"

# Instructions for user
echo ""
echo "✅ Project prepared for GitHub migration!"
echo ""
echo "Next steps:"
echo "1. Create a new repository on GitHub"
echo "2. Run these commands with your GitHub repository URL:"
echo ""
echo "   git branch -M main"
echo "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git"
echo "   git push -u origin main"
echo ""
echo "3. Set up GitHub secrets (see GITHUB_FIREBASE_DEPLOYMENT.md for details)"
echo "4. Your GitHub Actions will automatically deploy to Firebase!"
echo ""