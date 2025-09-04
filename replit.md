# GreenVoice Invoice Management Platform

## Project Overview
An advanced invoice generation and payment processing platform that enables professional document creation, distribution, and secure financial transactions. The platform includes comprehensive AI integration for intelligent business assistance.

## Deployment Environments

### Replit Deployment
When running on Replit, the application automatically uses OIDC authentication through Replit's identity system.

**Required Environment Variables for Replit:**
```bash
REPLIT_DOMAINS=your-repl-domain.replit.dev
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc
DATABASE_URL=your-database-url
SESSION_SECRET=your-session-secret
```

### GitHub/Firebase Deployment
When deployed via GitHub Actions to Firebase (or other platforms), the application uses standard OAuth authentication.

**Required Environment Variables for GitHub/Firebase:**
```bash
DATABASE_URL=your-database-url
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# Optional: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
```

## Authentication System

The application automatically detects the deployment environment:

- **Replit Environment**: Uses OIDC authentication when `REPLIT_DOMAINS` and `REPL_ID` are present
- **Standard Environment**: Uses OAuth authentication (Google, Facebook, GitHub) for all other deployments

## Sync Between Environments

### From Replit to GitHub:
1. Make changes in your Replit environment
2. Use the built-in Git integration or run: `git add . && git commit -m "Your message" && git push`
3. GitHub Actions will automatically deploy to Firebase

### From GitHub to Replit:
1. Make changes via GitHub (PRs, direct commits)
2. In Replit console, run: `git pull origin main`
3. Replit will automatically restart with the new changes

## Environment-Specific Features

### Replit-Specific:
- Automatic OIDC user authentication
- Session management via Replit's identity system
- Direct integration with Replit's user profiles

### GitHub/Firebase-Specific:
- OAuth login with Google, Facebook, GitHub
- Standard session management
- Suitable for public deployments

## Development Workflow

1. **Local Development**: Copy `.env.example` to `.env` and configure for your preferred auth method
2. **Replit Development**: Use Replit secrets or `.env` with Replit-specific variables
3. **Production**: Use GitHub secrets for Firebase deployment or Replit secrets for Replit deployment

## Recent Changes (January 20, 2025)

### ✅ Fixed GitHub and Replit Sync Issues
- **Unified Authentication**: Created conditional authentication system that works on both platforms
- **Fixed Import Paths**: Resolved broken import paths from auth system reorganization  
- **Cross-Platform Compatibility**: App now automatically detects deployment environment
- **Consistent API**: All routes use the same authentication middleware interface

### ✅ AI Assistant with Usage Limits Integration
- **AI Usage Tracking System**: Created comprehensive usage tracking with PostgreSQL database
- **Tiered Usage Limits**: Implemented hard limits for free/guest users vs higher limits for premium accounts
- **AI Usage Service**: Built backend service for tracking and enforcing usage limits
- **Real-time Usage Display**: Added usage statistics to AI chat interface
- **Error Handling**: Comprehensive error handling for usage limit violations

### ✅ Previous AI Assistant Integration
- **Added OpenAI Service**: Created comprehensive OpenAI integration with specialized business context
- **AI Chat Component**: Built interactive chat interface with real-time messaging capabilities
- **AI Assistant Page**: Developed dedicated page with features overview and use cases
- **Navigation Integration**: Added AI Assistant to main navigation with Bot icon
- **Smart Features**: Implemented specialized AI functions for:
  - Invoice content generation
  - Payment collection advice
  - Business insights analysis
  - General business consultation

### Key Features
- **Cross-Platform Authentication**: Automatic environment detection and appropriate auth setup
- **Usage Tracking**: Real-time tracking of AI interactions with daily/monthly limits
- **Plan-Based Limits**: Guest accounts (3 daily, 10 monthly) vs Premium accounts (100 daily, 1000 monthly)
- **Smart Conversations**: Real-time chat with AI for business questions
- **Invoice Generation**: AI-powered content suggestions and descriptions
- **Payment Collection**: Professional advice for overdue invoices
- **Business Insights**: Data-driven recommendations for cash flow improvement
- **Context-Aware**: Specialized prompts for invoice management scenarios
- **Real-time Quota Display**: Users see remaining usage limits in the chat interface

## Project Architecture

### Frontend Structure
- React.js with TypeScript
- Wouter for routing
- Tailwind CSS for styling
- Shadcn/ui components
- TanStack Query for data management

### AI Integration
- **OpenAI API**: GPT-3.5-turbo for conversational AI
- **HuggingFace API**: Stable Diffusion for image generation
- **Specialized Services**: Context-aware business assistance
- **Error Handling**: Comprehensive error states and API key validation

### Key Components
- `AIChat`: Interactive chat interface with message history
- `AIAssistantPage`: Main AI features page with tabs
- `OpenAI Service`: API integration with business-specific prompts
- `HuggingFace Service`: Image generation capabilities

## User Preferences
- Professional, concise communication
- Focus on practical business solutions
- Comprehensive documentation
- Error handling with clear user guidance

## Technical Dependencies
- OpenAI SDK for chat completions
- HuggingFace Inference for image generation
- Radix UI components for chat interface
- Lucide React icons for UI elements

## Environment Variables Required
- `DATABASE_URL`: PostgreSQL database connection string
- `SESSION_SECRET`: Secret key for session management
- `VITE_OPENAI_API_KEY`: OpenAI API key for AI chat functionality
- `VITE_HUGGINGFACE_API_KEY`: HuggingFace API key for image generation

### Replit-Specific (when deploying on Replit):
- `REPLIT_DOMAINS`: Your Replit domain
- `REPL_ID`: Your Replit application ID

### OAuth-Specific (when deploying elsewhere):
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `FACEBOOK_APP_ID` & `FACEBOOK_APP_SECRET`: Facebook OAuth credentials (optional)
- `GITHUB_CLIENT_ID` & `GITHUB_CLIENT_SECRET`: GitHub OAuth credentials (optional)

## Current Status
- ✅ GitHub and Replit sync issues resolved with conditional authentication
- ✅ Build process working on both platforms
- ✅ AI Assistant fully integrated and functional with OpenAI API
- ✅ Real-time usage tracking system with PostgreSQL database
- ✅ Tiered usage limits implemented (guest: 3/10, premium: 100/1000)
- ✅ Usage statistics display in chat interface
- ✅ Navigation updated with AI Assistant access
- ✅ Comprehensive error handling for usage violations
- ✅ API endpoints for tracking, checking, and viewing usage stats
- ✅ Cross-platform deployment compatibility
- Ready for deployment on both Replit and GitHub/Firebase

## Database Schema Updates
- Added `ai_usage_tracking` table for individual interaction logging
- Added `ai_usage_summary` table for aggregated daily/monthly statistics
- Implemented usage counting and limit enforcement logic
- Real-time tracking of tokens used, request types, and timestamps

## API Endpoints Added
- `POST /api/ai/chat` - AI conversation endpoint with usage tracking
- `GET /api/ai/usage-stats` - Current usage statistics for user/session
- `GET /api/ai/check-usage` - Check if usage is allowed for request type
- `POST /api/ai/track-usage` - Manual usage tracking endpoint