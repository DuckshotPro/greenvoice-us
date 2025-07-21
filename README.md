# InvoiceFlow Application

InvoiceFlow is a comprehensive invoice management platform that enables professional document creation, distribution, and secure financial transactions across multiple digital channels with an integrated client payment portal.

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation and Setup](#installation-and-setup)
4. [Database Setup and Migration](#database-setup-and-migration)
5. [Available Commands](#available-commands)
6. [Configuration Options](#configuration-options)
7. [User Guide](#user-guide)
8. [Advanced Features](#advanced-features)
9. [Troubleshooting](#troubleshooting)
10. [License](#license)

## ✨ Features

InvoiceFlow provides a complete invoice creation and management solution:

- **Invoice Creation and Management**
  - Professional invoice templates
  - Line item management with automatic calculations
  - Tax rate configuration
  - Discount and coupon code support (percentage or fixed amount)
  - Custom notes and terms
  - Invoice status tracking (draft, sent, paid, overdue)

- **Scheduling & Recurring Invoices**
  - Schedule invoices for future dates
  - Create recurring invoice templates (daily, weekly, monthly, quarterly, yearly)
  - Automatic invoice generation from templates

- **Client Payment Portal**
  - Secure payment processing with Stripe integration
  - Professional invoice display for clients
  - Real-time payment status tracking
  - PDF download functionality for clients
  - Complete analytics tracking for payment interactions

- **Comprehensive Sharing Options**
  - Generate and share PDF invoices
  - Email invoicing with customizable messages
  - Social media sharing (Twitter, Facebook, LinkedIn, WhatsApp)
  - Direct link sharing with unique URLs
  - SMS sharing capability
  - Payment portal links for secure client payments

- **Branding Customization**
  - Custom color schemes for invoices
  - Font selection and typography options
  - AI-powered logo and pattern generation (via Hugging Face)
  - Custom header and footer text
  - Multiple template designs

- **Advanced Analytics Dashboard**
  - Share method tracking (email, link, social media)
  - View count analytics for invoices
  - Filtering by date rangesAccessing7 days, 30 days, 90 days, all time)
  - Data grouping options (by method, day, week, month)
  - Visual charts and graphs for data interpretation

- **UTM Parameter Tracking**
  - Track marketing campaign effectiveness
  - Capture source, medium, campaign, content, and term parameters
  - Integrate with the analytics dashboard

- **Progress Billing System**
  - Break large contracts into manageable milestones
  - Track milestone completion and payment status
  - Generate invoices for completed milestones
  - Client portal access for milestone tracking

- **Performance Monitoring & Optimization**
  - Real-time server performance tracking
  - API response time monitoring
  - Database health monitoring
  - Cost optimization features

- **AI Assistant with Usage Limits**
  - OpenAI-powered business assistant for invoice management
  - Specialized help with invoice content generation and payment strategies
  - Business insights and cash flow improvement recommendations
  - Real-time usage tracking with tiered limits (guest: 3 daily/10 monthly, premium: 100 daily/1000 monthly)
  - Context-aware conversations tailored to invoice management scenarios

- **Premium Features (Freemium Model)**
  - Ad-based temporary premium access
  - Analytics dashboard for premium users
  - AI-generated branding assets (logos and patterns)
  - Premium invoice templates
  - Advanced AI Assistant usage limits
  - Subscription management system

## 🔧 Prerequisites

Before installing InvoiceFlow, ensure you have:

- Node.js (version 20.x or higher)
- PostgreSQL (version 16.x or higher)
- npm (version 10.x or higher)

## 🚀 Installation and Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/invoiceflow.git
cd invoiceflow
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database Connection
DATABASE_URL=postgresql://username:password@localhost:5432/invoiceflow

# Session Configuration
SESSION_SECRET=your_secure_session_secret_here

# Email Configuration (Optional - for email sharing)
SENDGRID_API_KEY=your_sendgrid_api_key

# Stripe Integration (Optional - for premium subscriptions)
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key

# AI Integration (Required for branding and assistant features)
HUGGINGFACE_API_KEY=your_huggingface_api_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

### Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5000

## 💾 Database Setup and Migration

### Initialize Database

To set up the database schema:

```bash
npm run db:push
```

This command will create all necessary tables in the PostgreSQL database.

### Database Migration (When Schema Changes)

After making changes to the schema in `shared/schema.ts`:

```bash
npm run db:push
```

This will safely update your database schema while preserving data.

## 📝 Available Commands

InvoiceFlow provides the following npm commands:

```bash
# Development
npm run dev          # Start development server

# Database
npm run db:push      # Push schema changes to the database
npm run db:studio    # Launch Drizzle Studio to view/edit data

# Building & Deployment
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run tests
npm run lint         # Run linting

# Admin Tools
npm run admin:logs   # View system logs
npm run admin:process # Manually process scheduled invoices and templates
```

## ⚙️ Configuration Options

### Customizing the Application

Configuration options can be modified in the following files:

- **theme.json**: Customize the application's appearance
  ```json
  {
    "primary": "#4f46e5",
    "variant": "professional",
    "appearance": "light",
    "radius": 0.5
  }
  ```

- **tailwind.config.ts**: Adjust the Tailwind CSS theme

### Scheduled Task Configuration

Scheduled task intervals can be configured in `server/scheduler.ts`:

```typescript
// Default values (in milliseconds)
SCHEDULED_INVOICES_INTERVAL: 5 * 60 * 1000,  // 5 minutes
RECURRING_TEMPLATES_INTERVAL: 60 * 60 * 1000 // 1 hour
```

## 📘 User Guide

### Creating and Managing Invoices

1. **Creating a New Invoice**:
   - Navigate to the dashboard
   - Click "Create Invoice"
   - Fill in the required fields
   - Add line items with description, quantity, and rate
   - Apply taxes and discounts as needed
   - Click "Save" or "Save & Share"

2. **Setting Up Recurring Invoices**:
   - Create an invoice template
   - Set frequency (daily, weekly, monthly, quarterly, yearly)
   - Configure next generation date
   - Enable the recurring template

3. **Scheduling Invoices**:
   - Create an invoice
   - Click "Schedule"
   - Set the future date for sending
   - Save the schedule

### Sharing Invoices

1. **Share Options**:
   - From an invoice, click "Share"
   - Choose sharing method (link, email, social, payment portal)
   - For email: Enter recipient details and customize message
   - For social: Select platform and share directly
   - For link: Copy the generated link
   - For payment portal: Share secure payment link with clients

2. **Client Payment Portal**:
   - Clients receive a secure link to view and pay invoices
   - Professional invoice display with itemized breakdown
   - Stripe-powered payment processing
   - Real-time payment status updates
   - PDF download capability for clients
   - Full analytics tracking for payment interactions

3. **View Tracking**:
   - All shared invoices are automatically tracked
   - Payment portal interactions are monitored
   - UTM parameters are captured for marketing campaign analysis

### Analytics Dashboard

1. **Accessing Analytics**:
   - Navigate to "Analytics Dashboard" (Premium feature)
   - View share method distribution
   - See top invoices by view count
   - Filter by date range
   - Group data by different time periods

### AI Assistant Features

1. **Using the AI Assistant**:
   - Navigate to "AI Assistant" in the main navigation
   - Ask questions about invoice management, payment strategies, or business insights
   - Generate content suggestions for invoice descriptions and terms
   - Get professional advice for collecting overdue payments
   - View real-time usage statistics showing remaining daily/monthly limits

2. **Usage Limits by Account Type**:
   - **Guest Accounts**: 3 interactions per day, 10 per month
   - **Premium Accounts**: 100 interactions per day, 1,000 per month
   - Usage resets daily and monthly automatically
   - Comprehensive error handling when limits are reached

### Branding Customization

1. **Basic Branding Settings**:
   - Navigate to "Branding Settings"
   - Customize primary, secondary, and accent colors
   - Select font family for invoices
   - Choose invoice template design

2. **AI-Generated Branding (Premium)**:
   - Generate custom logos by providing a text description
   - Create seamless patterns using color and style preferences
   - Preview and apply generated assets to invoices
   - All generated assets are saved to your account

3. **Apply Branding to Invoices**:
   - All branding settings are automatically applied to new invoices
   - Existing invoices will use the current branding settings
   - Brand settings are preserved when exporting to PDF

## 🔍 Advanced Features

### Admin Controls

System administrators can access additional features:

1. **System Logs**:
   ```bash
   npm run admin:logs
   ```

2. **Database Health Check**:
   ```bash
   curl http://localhost:5000/api/admin/db-health
   ```

3. **Manual Invoice Processing**:
   ```bash
   npm run admin:process
   ```

### API Endpoints

InvoiceFlow provides a comprehensive API:

- **Authentication**: `/api/login`, `/api/register`, `/api/logout`
- **Invoices**: `/api/invoices`, `/api/invoices/:id`
- **Templates**: `/api/recurring-templates`
- **AI Assistant**: `/api/ai/chat`, `/api/ai/usage-stats`, `/api/ai/check-usage`, `/api/ai/track-usage`
- **Analytics**: `/api/analytics/share-methods`, `/api/analytics/share-views`
- **Branding**: `/api/branding/settings`, `/api/branding/generate-logo`, `/api/branding/generate-pattern`
- **Premium**: `/api/premium/watch-ad`, `/api/premium/verify-subscription`
- **Admin**: `/api/admin/logs`, `/api/admin/db-health`, `/api/admin/system`

## 🔧 Troubleshooting

### Common Issues and Solutions

1. **Database Connection Issues**:
   ```bash
   # Check PostgreSQL status
   sudo service postgresql status
   
   # Verify connection
   npm run db:verify
   ```

2. **Email Sending Failures**:
   - Verify SendGrid API key is correctly set
   - Check email template formatting

3. **Server Startup Problems**:
   - Clear node_modules and reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```

4. **Analytics Not Recording**:
   - Ensure database tables exist:
   ```bash
   npm run db:check share_analytics
   ```

5. **AI Assistant Issues**:
   - Verify the OpenAI API key is correctly configured:
   ```bash
   # Test API key configuration
   curl -X GET "http://localhost:5000/api/ai/usage-stats"
   ```
   - Check usage limits if AI responses are blocked
   - Ensure user has remaining daily/monthly quotas
   - Review error messages for specific API issues

6. **AI Branding Feature Issues**:
   - Verify the Hugging Face API key is correctly configured:
   ```bash
   # Test the Hugging Face API connection
   curl -X POST \
     -H "Authorization: Bearer $HUGGINGFACE_API_KEY" \
     -H "Content-Type: application/json" \
     https://api-inference.huggingface.co/status
   ```
   - Check premium access status for the user
   - Inspect network requests when generating logos and patterns

## 📚 Additional Documentation

For detailed information about specific features:

- **[AI Assistant API Documentation](docs/AI_ASSISTANT_API.md)**: Complete API reference for AI Assistant endpoints
- **[AI Assistant User Guide](docs/AI_ASSISTANT_USER_GUIDE.md)**: Comprehensive user guide for AI Assistant features
- **[Deployment Guide](DEPLOYMENT.md)**: Step-by-step deployment instructions and troubleshooting
- **[Changelog](docs/CHANGELOG.md)**: Detailed changelog including AI Assistant integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**InvoiceFlow** - Professional Invoice Management Solution | © 2025 InvoiceFlow Team