# Firebase Deployment Guide

## Quick Setup Steps

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Create a Firebase project** at https://console.firebase.google.com

4. **Update project configuration**:
   - Edit `.firebaserc` and replace "your-project-id" with your actual Firebase project ID

5. **Set up database** (Choose one option):

   **Option A: Cloud PostgreSQL (Recommended)**
   - Create a database on Neon (https://neon.tech), Supabase, or Google Cloud SQL
   - Get your connection string
   
   **Option B: Firestore**
   - Enable Firestore in your Firebase project
   - Migrate your data structure

6. **Configure environment variables**:
   ```bash
   firebase functions:config:set stripe.secret_key="your-stripe-secret-key"
   firebase functions:config:set stripe.publishable_key="your-stripe-publishable-key"
   firebase functions:config:set database.url="your-database-connection-string"
   ```

7. **Deploy your application**:
   ```bash
   ./deploy-firebase.sh
   ```

## Important Changes for Firebase

### Database Setup
Your invoice platform currently uses PostgreSQL. For production deployment, you'll need a cloud database service. I recommend:

- **Neon** (https://neon.tech) - PostgreSQL with excellent free tier
- **Supabase** (https://supabase.com) - PostgreSQL with additional features
- **Google Cloud SQL** - Enterprise-grade PostgreSQL

### Environment Variables
The following environment variables need to be configured in Firebase Functions:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key  
- `DATABASE_URL` - Your cloud database connection string

### Server Code Adaptation
The Firebase Functions setup includes:
- Express.js server adapted for serverless functions
- CORS configuration for Firebase hosting
- Basic API endpoints structure
- Health check endpoint

## Files Created
- `firebase.json` - Firebase hosting and functions configuration
- `.firebaserc` - Firebase project configuration
- `functions/` - Firebase Functions directory with server code
- `deploy-firebase.sh` - Automated deployment script

## Next Steps
1. Create your Firebase project and update the project ID
2. Choose and set up your cloud database
3. Configure your environment variables
4. Run the deployment script

Your invoice platform will then be live on Firebase with professional hosting and serverless backend functions.