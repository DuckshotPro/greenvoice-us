# GitHub and Replit Sync Guide

This guide explains how to work with the GreenVoice Invoice Platform across both GitHub and Replit environments.

## Overview

The application is designed to work seamlessly in two environments:
- **Replit**: For rapid development and prototyping with OIDC authentication
- **GitHub/Firebase**: For production deployment with OAuth authentication

## Authentication System

The app automatically detects the deployment environment and configures authentication accordingly:

### Replit Environment (OIDC)
- **Detection**: Presence of `REPLIT_DOMAINS` and `REPL_ID` environment variables
- **Authentication**: Uses Replit's OIDC system for user management
- **Features**: Automatic user profile integration, session management via Replit

### GitHub/Firebase Environment (OAuth)
- **Detection**: Absence of Replit-specific environment variables
- **Authentication**: Uses standard OAuth providers (Google, Facebook, GitHub)
- **Features**: Flexible OAuth provider configuration, suitable for public deployment

## Environment Setup

### For Replit Development

1. **Set Required Secrets in Replit:**
   ```bash
   REPLIT_DOMAINS=your-app-name.your-username.replit.dev
   REPL_ID=your-repl-id
   DATABASE_URL=your-database-connection-string
   SESSION_SECRET=your-session-secret
   ```

2. **Optional API Keys:**
   ```bash
   VITE_OPENAI_API_KEY=sk-...
   VITE_HUGGINGFACE_API_KEY=hf_...
   STRIPE_SECRET_KEY=sk_...
   STRIPE_PUBLISHABLE_KEY=pk_...
   ```

### For GitHub/Firebase Deployment

1. **Set GitHub Secrets:**
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `FIREBASE_SERVICE_ACCOUNT`
   - `FIREBASE_PROJECT_ID`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`

2. **OAuth Provider Setup (choose one or more):**
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FACEBOOK_APP_ID=your-facebook-app-id
   FACEBOOK_APP_SECRET=your-facebook-app-secret
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   ```

## Development Workflow

### 1. Starting from Replit

**Initial Setup:**
```bash
# Clone or create your project in Replit
# Set up your Replit secrets
# Run the application
npm run dev
```

**Sync to GitHub:**
```bash
# Add your changes
git add .
git commit -m "Your commit message"
git push origin main
```

### 2. Starting from GitHub

**Clone to Replit:**
```bash
# Import GitHub repository to Replit
# Or clone manually:
git clone https://github.com/yourusername/your-repo.git
```

**Set up Replit Environment:**
1. Configure Replit secrets
2. Run `npm install`
3. Run `npm run dev`

### 3. Ongoing Development

**From Replit to GitHub:**
```bash
git add .
git commit -m "Feature: description of changes"
git push origin main
```

**From GitHub to Replit:**
```bash
git pull origin main
# Replit will automatically restart
```

## Build and Deployment

### Replit Deployment
- Automatically builds and serves when you run `npm run dev`
- Uses `.replit` configuration for automatic deployment
- Accessible at your Replit domain

### GitHub/Firebase Deployment
- Triggered automatically on pushes to `main` branch
- Uses GitHub Actions workflow (`.github/workflows/deploy-firebase.yml`)
- Deploys to Firebase Hosting

## Common Issues and Solutions

### 1. Build Failures
**Issue**: `Could not resolve "../auth"` or similar import errors
**Solution**: Fixed in the latest version - auth imports now use the conditional system

### 2. Authentication Not Working
**Issue**: Users can't log in
**Solutions**:
- **Replit**: Check `REPLIT_DOMAINS` and `REPL_ID` are set correctly
- **GitHub**: Ensure OAuth provider credentials are configured in GitHub secrets

### 3. Environment Variable Mismatch
**Issue**: App behaves differently between environments
**Solution**: 
- Use `.env.example` as a template
- Ensure all required variables are set for your target environment
- Check that OAuth/OIDC configurations match your deployment

### 4. Database Connection Issues
**Issue**: Database not connecting
**Solution**:
- Verify `DATABASE_URL` is correctly formatted
- Ensure database is accessible from your deployment environment
- Check that database schema is up to date

## File Structure for Sync

### Key Files to Sync:
```
├── server/
│   ├── middleware/auth.ts     # Standard OAuth authentication
│   ├── replitAuth.ts         # Replit OIDC authentication
│   └── routes/routes.ts      # Conditional auth setup
├── .github/workflows/        # GitHub Actions
├── .replit                   # Replit configuration
├── .env.example             # Environment template
└── package.json             # Dependencies
```

### Files to Ignore:
- `.env` (contains secrets)
- `node_modules/`
- `dist/`
- Build artifacts

## Testing Your Setup

### Local Testing:
```bash
npm install
npm run build  # Should complete without errors
npm run dev    # Should start server (may fail on DB connection, which is expected)
```

### Environment Detection Testing:
The app will log which authentication system it's using:
- "Using Replit OIDC authentication" for Replit environments
- "Using standard OAuth authentication" for GitHub/other environments

## Best Practices

1. **Commit Often**: Small, frequent commits make sync easier
2. **Test Both Environments**: Ensure changes work in both Replit and GitHub deployments
3. **Use Secrets Management**: Never commit sensitive data to the repository
4. **Document Changes**: Update this guide when making significant changes to the sync process
5. **Environment Parity**: Keep dependencies and configurations as similar as possible between environments

## Support

If you encounter issues with syncing between GitHub and Replit:

1. Check the logs in both environments for error messages
2. Verify environment variables are correctly set
3. Ensure the latest code is pulled/pushed between environments
4. Test the build process in both environments

The authentication system is now fully compatible with both deployment methods and should handle the sync seamlessly.