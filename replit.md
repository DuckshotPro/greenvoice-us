# GreenVoice Invoice Management Platform

## Project Overview
An advanced invoice generation and payment processing platform that enables professional document creation, distribution, and secure financial transactions. The platform includes comprehensive AI integration for intelligent business assistance.

## Recent Changes (January 20, 2025)

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
- `VITE_OPENAI_API_KEY`: OpenAI API key for AI chat functionality
- `VITE_HUGGINGFACE_API_KEY`: HuggingFace API key for image generation

## Current Status
- ✅ AI Assistant fully integrated and functional with OpenAI API
- ✅ Real-time usage tracking system with PostgreSQL database
- ✅ Tiered usage limits implemented (guest: 3/10, premium: 100/1000)
- ✅ Usage statistics display in chat interface
- ✅ Navigation updated with AI Assistant access
- ✅ Comprehensive error handling for usage violations
- ✅ API endpoints for tracking, checking, and viewing usage stats
- ✅ Documentation updated in README.md
- Ready for OpenAI API key configuration by user

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