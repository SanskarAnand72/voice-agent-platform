# API Structure & Endpoints

## 🌐 API Design Philosophy
- **RESTful** for public-facing APIs
- **tRPC** for internal type-safe APIs
- **GraphQL** (optional) for complex queries
- **WebSocket** for real-time features

## 📡 Base URL Structure

```
Production:  https://api.yourplatform.com/v1
Development: http://localhost:3001/api/v1
```

## 🔑 Authentication

### Headers
```
Authorization: Bearer <JWT_TOKEN>
X-Workspace-ID: <WORKSPACE_UUID>
X-API-Key: <API_KEY> (for server-to-server)
```

### Auth Endpoints

```typescript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/oauth/:provider (google, github)
POST   /api/auth/2fa/enable
POST   /api/auth/2fa/verify
```

## 📋 Core API Endpoints

### 1. Workspaces

```typescript
// Workspace Management
GET    /api/workspaces              // List user's workspaces
POST   /api/workspaces              // Create new workspace
GET    /api/workspaces/:id          // Get workspace details
PATCH  /api/workspaces/:id          // Update workspace
DELETE /api/workspaces/:id          // Delete workspace

// Workspace Settings
GET    /api/workspaces/:id/settings
PATCH  /api/workspaces/:id/settings
PATCH  /api/workspaces/:id/branding // White-label settings

// Workspace Members
GET    /api/workspaces/:id/members
POST   /api/workspaces/:id/members/invite
PATCH  /api/workspaces/:id/members/:userId
DELETE /api/workspaces/:id/members/:userId

// Workspace Usage
GET    /api/workspaces/:id/usage
GET    /api/workspaces/:id/usage/summary
```

### 2. AI Agents

```typescript
// Agent CRUD
GET    /api/agents                  // List all agents
POST   /api/agents                  // Create agent
GET    /api/agents/:id              // Get agent
PATCH  /api/agents/:id              // Update agent
DELETE /api/agents/:id              // Delete agent
POST   /api/agents/:id/duplicate    // Clone agent

// Agent Configuration
PATCH  /api/agents/:id/voice        // Update voice settings
PATCH  /api/agents/:id/llm          // Update LLM settings
PATCH  /api/agents/:id/prompt       // Update system prompt
PATCH  /api/agents/:id/behavior     // Update behavior settings

// Agent Testing
POST   /api/agents/:id/test         // Test agent (text)
POST   /api/agents/:id/test-call    // Test with actual call

// Agent Flows
GET    /api/agents/:id/flows
POST   /api/agents/:id/flows
GET    /api/agents/:id/flows/:flowId
PATCH  /api/agents/:id/flows/:flowId
DELETE /api/agents/:id/flows/:flowId
POST   /api/agents/:id/flows/:flowId/activate

// Agent Analytics
GET    /api/agents/:id/analytics
GET    /api/agents/:id/performance
GET    /api/agents/:id/usage
```

### 3. Calls

```typescript
// Call Management
GET    /api/calls                   // List calls (paginated)
POST   /api/calls                   // Initiate outbound call
GET    /api/calls/:id               // Get call details
DELETE /api/calls/:id               // Delete call record

// Call Control (during active call)
POST   /api/calls/:id/transfer      // Transfer call
POST   /api/calls/:id/hold          // Put on hold
POST   /api/calls/:id/resume        // Resume
POST   /api/calls/:id/hangup        // End call
POST   /api/calls/:id/inject-audio  // Play audio file
POST   /api/calls/:id/update-context // Update session data

// Call Data
GET    /api/calls/:id/transcript    // Get full transcript
GET    /api/calls/:id/recording     // Get recording URL
GET    /api/calls/:id/analytics     // Get call analytics
POST   /api/calls/:id/feedback      // Submit user rating

// Bulk Operations
POST   /api/calls/bulk-dial         // Bulk outbound calls
GET    /api/calls/export            // Export call data (CSV)

// Real-time (WebSocket)
WS     /api/calls/:id/stream        // Live transcript stream
WS     /api/calls/:id/metrics       // Live call metrics
```

### 4. Billing & Wallet

```typescript
// Wallet
GET    /api/wallet                  // Get wallet balance
POST   /api/wallet/topup            // Add funds
GET    /api/wallet/transactions     // Transaction history
POST   /api/wallet/auto-topup       // Configure auto-topup

// Subscription
GET    /api/subscription            // Current plan
POST   /api/subscription/upgrade    // Change plan
POST   /api/subscription/cancel     // Cancel subscription
POST   /api/subscription/resume     // Resume subscription

// Invoices
GET    /api/invoices                // List invoices
GET    /api/invoices/:id            // Get invoice
GET    /api/invoices/:id/download   // Download PDF
POST   /api/invoices/:id/pay        // Pay invoice

// Plans
GET    /api/plans                   // List available plans
GET    /api/plans/:slug             // Get plan details

// Payment Methods
GET    /api/payment-methods
POST   /api/payment-methods         // Add payment method
DELETE /api/payment-methods/:id     // Remove payment method
PATCH  /api/payment-methods/:id/default // Set as default

// Usage & Billing
GET    /api/usage/current-month
GET    /api/usage/history
GET    /api/usage/breakdown         // By agent, user, etc.
```

### 5. Analytics & Reporting

```typescript
// Dashboard Analytics
GET    /api/analytics/overview
GET    /api/analytics/calls         // Call metrics
GET    /api/analytics/revenue       // Revenue metrics
GET    /api/analytics/agents        // Agent performance
GET    /api/analytics/users         // User activity

// Advanced Reports
POST   /api/reports/generate        // Custom report
GET    /api/reports/:id             // Get report
GET    /api/reports                 // List reports

// Real-time Metrics
GET    /api/metrics/live            // Live dashboard data
WS     /api/metrics/stream          // Real-time metrics stream

// Export
POST   /api/analytics/export        // Export to CSV/Excel
```

### 6. Integrations

```typescript
// Integration Management
GET    /api/integrations            // List available integrations
GET    /api/integrations/active     // List active integrations
POST   /api/integrations/:type/connect
DELETE /api/integrations/:id/disconnect
PATCH  /api/integrations/:id/settings

// Supported Integrations
POST   /api/integrations/webhooks
POST   /api/integrations/zapier
POST   /api/integrations/slack
POST   /api/integrations/discord
POST   /api/integrations/salesforce
POST   /api/integrations/hubspot
POST   /api/integrations/calendly

// Webhooks
GET    /api/webhooks               // List webhooks
POST   /api/webhooks               // Create webhook
PATCH  /api/webhooks/:id           // Update webhook
DELETE /api/webhooks/:id           // Delete webhook
POST   /api/webhooks/:id/test      // Test webhook
GET    /api/webhooks/:id/logs      // Webhook delivery logs
```

### 7. API Keys

```typescript
GET    /api/api-keys                // List API keys
POST   /api/api-keys                // Create API key
PATCH  /api/api-keys/:id            // Update (name, scopes)
DELETE /api/api-keys/:id            // Revoke API key
POST   /api/api-keys/:id/rotate     // Rotate key
GET    /api/api-keys/:id/usage      // Usage stats
```

### 8. Marketplace

```typescript
// Browse Marketplace
GET    /api/marketplace/listings    // Browse all
GET    /api/marketplace/listings/:id
GET    /api/marketplace/featured
GET    /api/marketplace/categories
GET    /api/marketplace/search

// Seller Management
POST   /api/marketplace/listings    // Create listing
PATCH  /api/marketplace/listings/:id
DELETE /api/marketplace/listings/:id
GET    /api/marketplace/my-listings
GET    /api/marketplace/earnings

// Buyer
POST   /api/marketplace/listings/:id/purchase
GET    /api/marketplace/purchases   // My purchases
POST   /api/marketplace/listings/:id/install

// Reviews
POST   /api/marketplace/listings/:id/reviews
GET    /api/marketplace/listings/:id/reviews
```

### 9. Omnichannel

```typescript
// WhatsApp
POST   /api/channels/whatsapp/send
POST   /api/channels/whatsapp/webhook
GET    /api/channels/whatsapp/conversations

// SMS
POST   /api/channels/sms/send
GET    /api/channels/sms/conversations

// Email
POST   /api/channels/email/send
GET    /api/channels/email/threads

// Web Chat
GET    /api/channels/webchat/widget-config
WS     /api/channels/webchat/connect

// Unified Inbox
GET    /api/inbox/conversations
GET    /api/inbox/conversations/:id
POST   /api/inbox/conversations/:id/reply
PATCH  /api/inbox/conversations/:id/assign
PATCH  /api/inbox/conversations/:id/status
```

### 10. Admin & Settings

```typescript
// User Profile
GET    /api/user/profile
PATCH  /api/user/profile
PATCH  /api/user/password
POST   /api/user/avatar

// Notifications
GET    /api/notifications
PATCH  /api/notifications/:id/read
PATCH  /api/notifications/read-all
PATCH  /api/notifications/settings

// Preferences
GET    /api/preferences
PATCH  /api/preferences

// Activity Logs
GET    /api/activity-logs
GET    /api/activity-logs/:id
```

## 🔌 Webhook Events

### Event Payloads

```typescript
// Call Events
call.initiated
call.answered
call.ended
call.failed
call.transferred
call.recording.ready

// Agent Events
agent.created
agent.updated
agent.deleted

// Billing Events
wallet.low_balance
wallet.topped_up
subscription.created
subscription.cancelled
subscription.renewed
invoice.paid
invoice.failed

// System Events
user.invited
user.joined
workspace.upgraded
```

### Webhook Payload Structure
```json
{
  "event": "call.ended",
  "timestamp": "2026-02-14T10:30:00Z",
  "workspace_id": "uuid",
  "data": {
    "call_id": "uuid",
    "agent_id": "uuid",
    "duration": 120,
    "cost": 1.20,
    "outcome": "completed",
    "transcript": [...],
    "sentiment_score": 0.85
  }
}
```

## 🌊 Streaming APIs (Server-Sent Events)

```typescript
// Real-time Call Streaming
GET    /api/stream/calls/live       // All active calls
GET    /api/stream/calls/:id        // Specific call

// Metrics Streaming
GET    /api/stream/metrics          // Dashboard metrics

// Notification Streaming
GET    /api/stream/notifications    // Real-time notifications
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    ...
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z",
    "request_id": "uuid"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Wallet balance too low to make call",
    "details": {
      "current_balance": 5.00,
      "required_balance": 10.00
    }
  },
  "meta": {
    "timestamp": "2026-02-14T10:30:00Z",
    "request_id": "uuid"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## 🚦 Rate Limiting

### Limits by Plan
```typescript
Free:       60 requests/minute
Starter:    300 requests/minute
Pro:        1000 requests/minute
Enterprise: Custom
```

### Rate Limit Headers
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707907800
```

## 🔒 Error Codes

```typescript
// Authentication
UNAUTHORIZED (401)
FORBIDDEN (403)
INVALID_TOKEN (401)
TOKEN_EXPIRED (401)

// Validation
VALIDATION_ERROR (422)
INVALID_INPUT (400)
MISSING_REQUIRED_FIELD (400)

// Resources
NOT_FOUND (404)
ALREADY_EXISTS (409)
RESOURCE_DELETED (410)

// Business Logic
INSUFFICIENT_BALANCE (402)
QUOTA_EXCEEDED (429)
PLAN_LIMIT_REACHED (403)
WORKSPACE_SUSPENDED (403)

// System
INTERNAL_ERROR (500)
SERVICE_UNAVAILABLE (503)
TIMEOUT (504)
```

## 🧪 Testing Endpoints

```typescript
// Health Check
GET    /api/health
GET    /api/health/db
GET    /api/health/redis
GET    /api/health/services

// Version
GET    /api/version

// Debugging (dev only)
GET    /api/debug/headers
POST   /api/debug/echo
```

---

**Next**: Folder Structure & Implementation Plan
