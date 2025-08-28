draftraft InvoiceFlow Application

InvoiceFlow is a comprehensive invoice management platform that enables professional document creation, distribution, and secure financial transactions across multiple digital channels.

## 📋 Table of Contents

1. [Features](#features)
2. [Prerequisites](#prerequisites)
3. [Installation and Setup](#installation-and-setup)
4. [New User Onboarding](#new-user-onboarding)
5. [Database Setup and Migration](#database-setup-and-migration)
6. [Available Commands](#available-commands)
7. [Configuration Options](#configuration-options)
8. [User Guide](#user-guide)
9. [Navigation Improvements](#navigation-improvements)
10. [Application Routes](#application-routes)
11. [Advanced Features](#advanced-features)
12. [API Endpoints](#api-endpoints)
13. [Troubleshooting](#troubleshooting)
14. [Development Notes](#development-notes)
15. [License](#license)

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

- **Comprehensive Sharing Options**
  - Generate and share PDF invoices
  - Email invoicing with customizable messages
  - Social media sharing (Twitter, Facebook, LinkedIn, WhatsApp)
  - Direct link sharing with unique URLs
  - SMS sharing capability

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

- **Premium Features (Freemium Model)**
  - Ad-based temporary premium access
  - Analytics dashboard for premium users
  - AI-generated branding assets (logos and patterns)
  - Premium invoice templates
  - Subscription management system

- **User Experience & Onboarding**
  - Comprehensive onboarding flow for new users
  - Interactive step-by-step guide through features
  - Progress tracking and completion status
  - Skip option for experienced users
  - Enhanced navigation with consistent SPA behavior

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

# AI Integration (Required for branding features)
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### Step 4: Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:5000

## 🎯 New User Onboarding

InvoiceFlow now includes a comprehensive onboarding experience for new users:

### First-Time User Experience
- **Automatic Onboarding**: New users are automatically redirected to an interactive onboarding flow
- **Step-by-Step Guide**: 5-step process covering all major features
- **Progress Tracking**: Visual progress indicator showing completion status
- **Skip Option**: Experienced users can skip onboarding and go directly to the dashboard

### Onboarding Steps
1. **Create Your First Invoice** - Introduction to invoice creation
2. **Share Your Invoice** - Learn about sharing capabilities
3. **Track Performance** - Discover analytics features
4. **Customize Your Brand** - Explore branding options
5. **Upgrade to Premium** - Learn about premium benefits

### Accessing Onboarding Later
- Navigate to `/onboarding` to revisit the onboarding flow
- Onboarding progress is saved in localStorage
- Can be accessed from the Help menu (future feature)

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

1. **For New Users**:
   - Complete the onboarding flow (automatic on first login)
   - Follow the guided tour to create your first invoice
   - Use the "Create Invoice" button from any onboarding step

2. **For Existing Users**:
   - Navigate to the dashboard
   - Click "Create Invoice" or use the quick action cards
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
   - Choose sharing method (link, email, social)
   - For email: Enter recipient details and customize message
   - For social: Select platform and share directly
   - For link: Copy the generated link

2. **View Tracking**:
   - All shared invoices are automatically tracked
   - UTM parameters are captured for marketing campaign analysis

### Analytics Dashboard

1. **Accessing Analytics**:
   - Navigate to "Analytics Dashboard" (Premium feature)
   - View share method distribution
   - See top invoices by view count
   - Filter by date range
   - Group data by different time periods

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

## 🧭 Navigation Improvements

### Enhanced User Experience
- **Consistent Navigation**: All navigation now uses React Router for smooth transitions
- **No Page Reloads**: Single Page Application (SPA) behavior maintained throughout
- **Improved Error Handling**: Better 404 pages with multiple recovery options
- **Mobile-Friendly**: Responsive navigation that works on all devices

### Navigation Features
- **Quick Action Cards**: Dashboard cards for direct access to main features
- **Breadcrumb Navigation**: Clear path indication (future enhancement)
- **Smart Redirects**: Automatic redirection based on user authentication status
- **Error Recovery**: Multiple ways to get back on track from error pages

### Keyboard Navigation
- **Tab Navigation**: Full keyboard accessibility support
- **Shortcut Keys**: Quick access to common actions (future enhancement)
- **Focus Management**: Proper focus handling for screen readers

## 🛣️ Application Routes

### Public Routes
- `/` - Landing page (marketing for non-authenticated users, dashboard for authenticated users)
- `/auth` - Login and registration page
- `/premium` - Premium features and subscription page
- `/faq` - Help and frequently asked questions
- `/roadmap` - Product roadmap and upcoming features
- `/share/:shareableLink` - Public invoice view (for shared invoices)

### Protected Routes (Require Authentication)
- `/onboarding` - New user onboarding flow
- `/create-invoice` - Invoice creation and editing
- `/history` - Invoice history and management
- `/branding` - Brand customization settings
- `/settings` - User profile and account settings

### Premium Routes (Require Premium Subscription)
- `/analytics` - Analytics dashboard and reporting

### Admin Routes (Require Admin Privileges)
- `/admin` - Admin console and system management

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
- **User Management**: `/api/user` (get current user info)
- **Invoices**: `/api/invoices`, `/api/invoices/:id`
- **Templates**: `/api/recurring-templates`
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

5. **AI Branding Feature Issues**:
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

### Navigation Issues

1. **Page Not Found (404) Errors**:
   - Use the "Return to Home" button on the 404 page
   - Try the "Sign In" option if you're trying to access protected content
   - Check that you're using the correct URL

2. **Authentication Redirects**:
   - Ensure you're logged in before accessing protected routes
   - Clear browser cache if experiencing persistent redirect loops
   - Check that cookies are enabled in your browser

3. **Onboarding Issues**:
   - Navigate to `/onboarding` to restart the onboarding flow
   - Clear localStorage if onboarding gets stuck
   - Contact support if onboarding doesn't work properly

## 🔧 Development Notes

### Recent Navigation Improvements

#### Files Modified
- `client/src/pages/auth-page.tsx` - Enhanced authentication flow
- `client/src/pages/home.tsx` - Standardized navigation patterns
- `client/src/pages/not-found.tsx` - Improved 404 page
- `client/src/App.tsx` - Added onboarding route

#### New Components
- `client/src/components/onboarding/onboarding-welcome.tsx` - Onboarding flow component

#### Technical Changes
- **Navigation Standardization**: Replaced `window.location.href` with React Router navigation
- **Authentication Flow**: Added explicit redirect callbacks to login/registration
- **Error Handling**: Enhanced 404 page with multiple recovery options
- **User Experience**: Added comprehensive onboarding for new users

#### Breaking Changes
- None - all changes are backward compatible
- Navigation behavior is improved but existing functionality remains the same

#### Testing Requirements
- Test authentication flow for new and existing users
- Verify onboarding flow works correctly
- Check navigation between all pages
- Test error recovery from 404 pages
- Validate mobile navigation functionality

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**InvoiceFlow** - Professional Invoice Management Solution | © 2025 InvoiceFlow Team