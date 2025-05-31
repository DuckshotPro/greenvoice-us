# GitHub to Firebase Deployment Guide

## Overview
This guide will help you migrate your invoice platform from Replit to Firebase using GitHub Actions for continuous deployment.

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Initialize git in your project:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Invoice platform"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

## Step 2: Set up Firebase Project

1. Go to https://console.firebase.google.com
2. Create a new project
3. Enable Hosting and Functions in the Firebase console
4. Copy your project ID

## Step 3: Configure Firebase Service Account

1. In your Firebase project, go to Project Settings > Service Accounts
2. Click "Generate new private key" 
3. Download the JSON file
4. Copy the entire contents of this JSON file

## Step 4: Set up GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, then add these secrets:

- `FIREBASE_SERVICE_ACCOUNT`: The entire JSON content from step 3
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
- `DATABASE_URL`: Your cloud database connection string

## Step 5: Set up Cloud Database

Choose one of these options:

### Option A: Neon (Recommended)
1. Go to https://neon.tech and create an account
2. Create a new project
3. Copy the connection string to use as `DATABASE_URL`

### Option B: Supabase
1. Go to https://supabase.com and create an account
2. Create a new project
3. Go to Settings > Database and copy the connection string

### Option C: Google Cloud SQL
1. Create a PostgreSQL instance in Google Cloud Console
2. Configure connection and get the connection string

## Step 6: Update Firebase Configuration

Edit `.firebaserc` and replace "your-project-id" with your actual Firebase project ID.

## Step 7: Deploy

Once everything is set up:

1. Push any changes to the main branch
2. GitHub Actions will automatically build and deploy your app
3. Check the Actions tab in GitHub to monitor deployment progress

## GitHub Actions Workflows

Two workflows have been created:

- **deploy-firebase.yml**: Deploys to production on pushes to main branch
- **preview.yml**: Creates preview deployments for pull requests

## Database Migration

You'll need to migrate your data from Replit's PostgreSQL to your cloud database:

1. Export your current data using `pg_dump` or similar
2. Import it to your new cloud database
3. Update your DATABASE_URL in GitHub secrets

## Environment Variables

Your app will automatically use these environment variables in production:
- Stripe keys for payment processing
- Database URL for data persistence
- Any other secrets you configure in GitHub

## Monitoring Deployment

- Check GitHub Actions for build status
- Firebase Console shows deployment history
- Access your live app at: `https://your-project-id.web.app`

Your invoice platform will be automatically deployed to Firebase whenever you push changes to GitHub.