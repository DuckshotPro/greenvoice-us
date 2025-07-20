# AI Assistant API Documentation

## Overview

The AI Assistant API provides intelligent business assistance for invoice management, including content generation, payment strategies, and business insights. The system implements tiered usage limits to control access based on account types.

## Base URL

All AI Assistant endpoints are accessed via:
```
/api/ai/
```

## Authentication

The AI Assistant supports both authenticated users and guest sessions:
- **Authenticated Users**: Usage tracked by user ID with plan-based limits
- **Guest Sessions**: Usage tracked by session ID with restrictive limits

## Usage Limits

### Account Types and Limits

| Account Type | Daily Limit | Monthly Limit | Token Limit per Request |
|-------------|-------------|---------------|------------------------|
| Guest       | 3           | 10            | 1,000                  |
| Premium     | 100         | 1,000         | 4,000                  |

### Usage Types

- `chat`: General AI conversations
- `content_generation`: Invoice content suggestions
- `business_insights`: Analytics and recommendations
- `payment_advice`: Overdue payment collection strategies

## API Endpoints

### 1. Chat with AI Assistant

**Endpoint:** `POST /api/ai/chat`

**Description:** Send a message to the AI assistant and receive intelligent responses tailored for business and invoice management.

**Request Body:**
```json
{
  "message": "How can I improve my invoice collection process?",
  "context": {
    "type": "payment_advice",
    "invoiceData": {
      "amount": 1500,
      "daysOverdue": 30
    }
  }
}
```

**Response:**
```json
{
  "response": "For a $1,500 invoice that's 30 days overdue, I recommend...",
  "tokensUsed": 145,
  "usageType": "payment_advice",
  "remainingUsage": {
    "daily": 2,
    "monthly": 9
  }
}
```

**Error Responses:**
```json
{
  "error": "Usage limit exceeded",
  "details": {
    "type": "daily_limit",
    "limit": 3,
    "used": 3,
    "resetTime": "2025-07-21T00:00:00Z"
  }
}
```

### 2. Get Usage Statistics

**Endpoint:** `GET /api/ai/usage-stats`

**Description:** Retrieve current usage statistics for the user or session.

**Response:**
```json
{
  "planType": "guest",
  "daily": {
    "used": 1,
    "limit": 3,
    "remaining": 2
  },
  "monthly": {
    "used": 5,
    "limit": 10,
    "remaining": 5
  },
  "allowedTypes": ["chat", "content_generation"],
  "maxTokensPerRequest": 1000
}
```

### 3. Check Usage Allowance

**Endpoint:** `GET /api/ai/check-usage`

**Description:** Check if a specific usage type is allowed before making a request.

**Query Parameters:**
- `type` (required): The usage type to check (`chat`, `content_generation`, etc.)

**Response:**
```json
{
  "allowed": true,
  "remainingDaily": 2,
  "remainingMonthly": 5,
  "planType": "guest"
}
```

**When Blocked:**
```json
{
  "allowed": false,
  "reason": "daily_limit_exceeded",
  "remainingDaily": 0,
  "remainingMonthly": 5,
  "planType": "guest",
  "resetTime": "2025-07-21T00:00:00Z"
}
```

### 4. Track Usage Manually

**Endpoint:** `POST /api/ai/track-usage`

**Description:** Manually record usage for administrative or testing purposes.

**Request Body:**
```json
{
  "usageType": "chat",
  "tokensUsed": 150,
  "metadata": {
    "source": "manual_test",
    "description": "Testing usage tracking"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

## Usage Context Types

### Chat Context
For general business conversations:
```json
{
  "context": {
    "type": "chat",
    "topic": "general_business"
  }
}
```

### Content Generation Context
For invoice content suggestions:
```json
{
  "context": {
    "type": "content_generation",
    "invoiceData": {
      "clientType": "corporate",
      "serviceCategory": "consulting",
      "amount": 2500
    }
  }
}
```

### Payment Advice Context
For overdue payment strategies:
```json
{
  "context": {
    "type": "payment_advice",
    "invoiceData": {
      "amount": 1500,
      "daysOverdue": 30,
      "clientRelationship": "long_term"
    }
  }
}
```

### Business Insights Context
For analytics and recommendations:
```json
{
  "context": {
    "type": "business_insights",
    "data": {
      "totalInvoices": 25,
      "averagePaymentTime": 22,
      "overduePercentage": 15
    }
  }
}
```

## Error Handling

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `usage_limit_exceeded` | Daily or monthly limit reached | Wait for reset or upgrade account |
| `invalid_api_key` | OpenAI API key not configured | Contact administrator |
| `rate_limit_exceeded` | Too many requests in short period | Wait and retry |
| `invalid_usage_type` | Unsupported usage type | Use valid type from allowed list |
| `token_limit_exceeded` | Message too long | Reduce message length |

### Error Response Format

```json
{
  "error": "Error type",
  "message": "Human-readable error description",
  "details": {
    "field": "Additional context",
    "limit": 3,
    "used": 3
  },
  "timestamp": "2025-07-20T14:30:00Z"
}
```

## Rate Limiting

- **Request Rate**: Maximum 10 requests per minute per user/session
- **Concurrent Requests**: Maximum 2 concurrent requests per user/session
- **Token Rate**: Respects per-request token limits based on account type

## Best Practices

### 1. Check Usage Before Requests
Always check usage allowance before making chat requests:
```javascript
const canUse = await fetch('/api/ai/check-usage?type=chat');
if (canUse.allowed) {
  // Proceed with chat request
}
```

### 2. Handle Usage Limits Gracefully
Implement proper error handling for usage limits:
```javascript
try {
  const response = await fetch('/api/ai/chat', { /* ... */ });
} catch (error) {
  if (error.type === 'usage_limit_exceeded') {
    // Show upgrade prompt or wait message
  }
}
```

### 3. Optimize Token Usage
- Keep messages concise but specific
- Use context appropriately to get better responses
- Avoid redundant information in requests

### 4. Monitor Usage Statistics
Display usage statistics to users:
```javascript
const stats = await fetch('/api/ai/usage-stats');
// Show remaining daily/monthly usage
```

## Database Schema

### AI Usage Tracking Table
```sql
CREATE TABLE ai_usage_tracking (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  session_id VARCHAR,
  usage_type VARCHAR NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(10,6) DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### AI Usage Summary Table
```sql
CREATE TABLE ai_usage_summary (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR,
  session_id VARCHAR,
  date DATE NOT NULL,
  usage_type VARCHAR,
  total_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(10,6) DEFAULT 0,
  requests_by_type JSONB DEFAULT '{}',
  tokens_by_type JSONB DEFAULT '{}',
  cost_by_type JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Monitoring and Analytics

### Usage Tracking
- All interactions are logged with timestamps
- Token usage is tracked for cost analysis
- Usage patterns are analyzed for optimization

### Performance Metrics
- Response times are monitored
- Error rates are tracked
- Usage patterns are analyzed for capacity planning

## Security Considerations

- API keys are stored securely as environment variables
- Usage tracking prevents abuse through hard limits
- Session-based tracking for guest users
- Input sanitization for all chat messages
- Rate limiting to prevent DoS attacks

## Support and Troubleshooting

### Common Issues

1. **"Usage limit exceeded" errors**
   - Check current usage with `/api/ai/usage-stats`
   - Verify account type and limits
   - Wait for daily/monthly reset

2. **"Invalid API key" errors**
   - Ensure `VITE_OPENAI_API_KEY` is set
   - Verify API key has proper permissions
   - Check API key billing status

3. **Slow response times**
   - Monitor OpenAI API status
   - Check network connectivity
   - Verify request size is within limits

### Debug Endpoints

For development and debugging:
```bash
# Check current usage
curl -X GET "http://localhost:5000/api/ai/usage-stats"

# Test usage tracking
curl -X POST "http://localhost:5000/api/ai/track-usage" \
  -H "Content-Type: application/json" \
  -d '{"usageType":"chat","tokensUsed":50}'
```