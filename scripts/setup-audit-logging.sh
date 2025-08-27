#!/bin/bash

# Setup script for audit logging with Neon database
# This script helps configure the audit logging system

echo "🔧 Setting up Audit Logging with Neon Database"
echo "=============================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set it to your Neon database connection string"
    echo "Example: export DATABASE_URL='postgresql://user:pass@host/db?sslmode=require'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Create the audit_logs table
echo "📊 Creating audit_logs table in Neon database..."
psql "$DATABASE_URL" -f scripts/create-audit-table.sql

if [ $? -eq 0 ]; then
    echo "✅ audit_logs table created successfully"
else
    echo "❌ Failed to create audit_logs table"
    exit 1
fi

# Set up environment variables
echo ""
echo "🔧 Environment Configuration"
echo "============================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Add audit logging configuration to .env
echo ""
echo "📝 Adding audit logging configuration to .env file..."

# Check if LOG_SHIP_URL is already set
if ! grep -q "LOG_SHIP_URL" .env; then
    echo "LOG_SHIP_URL=http://localhost:5000/api/audit-logs/ingest" >> .env
    echo "✅ Added LOG_SHIP_URL to .env"
else
    echo "ℹ️  LOG_SHIP_URL already configured in .env"
fi

# Check if LOG_RETENTION_DAYS is already set
if ! grep -q "LOG_RETENTION_DAYS" .env; then
    echo "LOG_RETENTION_DAYS=30" >> .env
    echo "✅ Added LOG_RETENTION_DAYS to .env"
else
    echo "ℹ️  LOG_RETENTION_DAYS already configured in .env"
fi

# Check if LOG_CLEANUP_INTERVAL_HOURS is already set
if ! grep -q "LOG_CLEANUP_INTERVAL_HOURS" .env; then
    echo "LOG_CLEANUP_INTERVAL_HOURS=24" >> .env
    echo "✅ Added LOG_CLEANUP_INTERVAL_HOURS to .env"
else
    echo "ℹ️  LOG_CLEANUP_INTERVAL_HOURS already configured in .env"
fi

# Check if BASE_URL is already set
if ! grep -q "BASE_URL" .env; then
    echo "BASE_URL=http://localhost:5000" >> .env
    echo "✅ Added BASE_URL to .env"
else
    echo "ℹ️  BASE_URL already configured in .env"
fi

echo ""
echo "🎉 Audit Logging Setup Complete!"
echo "================================"
echo ""
echo "📋 Configuration Summary:"
echo "  • Audit logs will be stored in Neon database"
echo "  • Retention period: 30 days (configurable via LOG_RETENTION_DAYS)"
echo "  • Cleanup runs every 24 hours (configurable via LOG_CLEANUP_INTERVAL_HOURS)"
echo "  • Ingest endpoint: http://localhost:5000/api/audit-logs/ingest"
echo ""
echo "🔍 Available Endpoints:"
echo "  • POST /api/audit-logs/ingest - Store audit logs"
echo "  • GET /api/audit-logs/recent - View recent logs"
echo "  • DELETE /api/audit-logs/cleanup - Manual cleanup"
echo ""
echo "📝 Usage Examples:"
echo "  • Use logAudit() for important events (DB operations, auth, etc.)"
echo "  • Warnings, errors, and critical logs are automatically stored"
echo "  • View logs: curl http://localhost:5000/api/audit-logs/recent"
echo ""
echo "⚠️  Next Steps:"
echo "  1. Restart your application to load the new configuration"
echo "  2. Test by triggering some audit events"
echo "  3. Monitor the audit_logs table in your Neon dashboard"
echo ""