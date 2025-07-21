# Deployment Guide

## Build Configuration Fix

The deployment was failing because the build process wasn't generating files in the expected directory structure. This has been fixed with a custom build script.

## Quick Deployment

### Step 1: Run the Deployment Build Script

```bash
./build-for-deployment.sh
```

This script will:
- Run the standard Vite and esbuild process
- Copy built frontend files to `client/dist/` (expected by deployment)
- Copy built files to `server/public/` (expected by server static serving)
- Verify all required files are in place

### Step 2: Deploy

After running the build script, the deployment should work correctly as it will find the required files at `client/dist/index.html`.

## Manual Build Process (Alternative)

If the script doesn't work, you can manually create the correct structure:

```bash
# Standard build
npm run build

# Create deployment directories
mkdir -p client/dist
mkdir -p server/public

# Copy files to expected locations
cp -r dist/public/* client/dist/
cp -r dist/public/* server/public/

# Verify files exist
ls -la client/dist/index.html
ls -la server/public/index.html
ls -la dist/index.js
```

## Deployment Configuration

The application is configured for Cloud Run deployment with the following structure:

- **Frontend**: Static files served from `client/dist/`
- **Backend**: Node.js server from `dist/index.js`
- **Port**: Application listens on port 5000
- **Static Files**: Express serves from `server/public/` in production

## Environment Variables for Deployment

Ensure these environment variables are configured in your deployment:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `VITE_OPENAI_API_KEY` - OpenAI API key for AI Assistant

### Optional
- `SENDGRID_API_KEY` - For email functionality
- `STRIPE_SECRET_KEY` - For payment processing
- `VITE_STRIPE_PUBLIC_KEY` - Stripe public key
- `HUGGINGFACE_API_KEY` - For AI image generation

## Build Output Structure

After running the build script, you should see:

```
project-root/
├── client/dist/           # Frontend files for deployment
│   ├── index.html
│   └── assets/
├── server/public/         # Frontend files for server static serving
│   ├── index.html
│   └── assets/
└── dist/                  # Server build output
    ├── index.js           # Main server file
    └── public/            # Original Vite build output
```

## Troubleshooting Deployment Issues

### Issue: "Application is looking for a build directory at client/dist/index.html that doesn't exist"

**Solution**: Run the deployment build script:
```bash
./build-for-deployment.sh
```

### Issue: Static assets not loading

**Verification**: Check that files exist in both locations:
```bash
ls -la client/dist/
ls -la server/public/
```

### Issue: Server not starting

**Check**: Verify the server build exists:
```bash
ls -la dist/index.js
```

### Issue: Database connection errors

**Solution**: Ensure `DATABASE_URL` environment variable is set correctly for your production database.

### Issue: AI Assistant not working

**Solution**: Ensure `VITE_OPENAI_API_KEY` environment variable is set with a valid OpenAI API key.

## Production Considerations

1. **Database Migration**: Run `npm run db:push` after deployment to ensure database schema is up-to-date
2. **Health Check**: The server includes health check endpoints at `/api/health`
3. **Logging**: All errors and performance metrics are logged for monitoring
4. **Security**: CORS is configured for production domains
5. **Performance**: Static assets are served with appropriate caching headers

## Post-Deployment Testing

After deployment, test these key features:

1. **Frontend Loading**: Visit the root URL to ensure the React app loads
2. **API Endpoints**: Test `/api/health` for server status
3. **Database**: Verify connection with `/api/auth/user` endpoint
4. **AI Assistant**: Test the AI chat functionality if OpenAI key is configured
5. **Static Assets**: Ensure CSS and JavaScript files load correctly

## Monitoring

The application includes built-in monitoring:

- **Performance Metrics**: Endpoint response times tracked
- **Error Logging**: Comprehensive error tracking and logging
- **Database Health**: Automatic database health monitoring
- **Usage Analytics**: AI Assistant usage tracking and limits

For production deployment, consider setting up external monitoring for:
- Application uptime
- Database performance
- API response times
- Error rates

---

The deployment configuration is now ready. Run the build script and deploy with confidence!