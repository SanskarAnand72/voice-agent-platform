# Voice AI SaaS Platform - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  Web Dashboard  │  Mobile App  │  WhatsApp  │  SMS  │  API SDK  │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                   API GATEWAY (Next.js + tRPC)                   │
│  - Authentication & Authorization (JWT)                          │
│  - Rate Limiting & Throttling                                    │
│  - Request Validation                                            │
│  - Load Balancing                                               │
└────────────┬────────────────────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────────────────────┐
│                    CORE SERVICES LAYER                           │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  Auth Service    │  Workspace       │  Billing Service         │
│  - Multi-tenant  │  Service         │  - Wallet System         │
│  - RBAC          │  - Tenant Mgmt   │  - Usage Tracking        │
│  - OAuth         │  - Team Mgmt     │  - Invoicing             │
│                  │                  │  - Payment Gateway       │
└──────────────────┴──────────────────┴──────────────────────────┘
             │                  │                  │
┌────────────▼──────────────────▼──────────────────▼──────────────┐
│                    AI & VOICE SERVICES                           │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  Voice Engine    │  LLM Router      │  Memory Engine           │
│  - ElevenLabs    │  - OpenAI        │  - Vector DB (Pinecone)  │
│  - Deepgram STT  │  - Groq          │  - RAG System            │
│  - Voice Clone   │  - Anthropic     │  - Session Context       │
│  - Emotion       │  - Local LLMs    │  - Long-term Memory      │
│                  │  - Fallback      │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
             │                  │                  │
┌────────────▼──────────────────▼──────────────────▼──────────────┐
│                  COMMUNICATION SERVICES                          │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  Call Service    │  Omnichannel     │  Flow Engine             │
│  - Twilio        │  - WhatsApp      │  - Visual Builder        │
│  - WebRTC        │  - SMS           │  - Workflow Execution    │
│  - SIP           │  - Email         │  - Template Library      │
│  - Call Control  │  - Web Chat      │  - Conditional Logic     │
└──────────────────┴──────────────────┴──────────────────────────┘
             │                  │                  │
┌────────────▼──────────────────▼──────────────────▼──────────────┐
│                    ANALYTICS & MONITORING                        │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  Analytics       │  Call Scoring    │  Monitoring              │
│  - Dashboards    │  - Sentiment     │  - Logs (Winston)        │
│  - Reports       │  - Outcomes      │  - APM (Sentry)          │
│  - Metrics       │  - AI Scoring    │  - Uptime Monitoring     │
└──────────────────┴──────────────────┴──────────────────────────┘
             │                  │                  │
┌────────────▼──────────────────▼──────────────────▼──────────────┐
│                      DATA LAYER                                  │
├──────────────────┬──────────────────┬──────────────────────────┤
│                  │                  │                          │
│  PostgreSQL      │  Redis Cache     │  S3 Storage              │
│  (Supabase)      │  - Sessions      │  - Recordings            │
│  - Multi-tenant  │  - Rate Limits   │  - Assets                │
│  - Row Level     │  - Queue         │  - Exports               │
│    Security      │                  │                          │
└──────────────────┴──────────────────┴──────────────────────────┘
             │                  │                  │
┌────────────▼──────────────────▼──────────────────▼──────────────┐
│                     QUEUE & WORKERS                              │
│  - BullMQ / Inngest                                             │
│  - Background Jobs: Billing, Analytics, Exports, Notifications  │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Key Architectural Decisions

### 1. Multi-Tenancy Strategy
- **Row-Level Security (RLS)** in PostgreSQL for data isolation
- **Workspace-based** partitioning (not schema-per-tenant)
- **Tenant Context** propagated through all services

### 2. Microservices vs Monolith
- **Modular Monolith** initially (Next.js App Router)
- **Service Modules** that can be extracted later
- **Clear Boundaries** between domains
- **Easy Migration** to microservices when needed

### 3. Real-time Architecture
- **WebSocket** for live call monitoring
- **Server-Sent Events** for notifications
- **Pusher/Ably** for pub/sub (optional)

### 4. Caching Strategy
- **Redis** for:
  - Session storage
  - Rate limiting
  - Queue management
  - Hot data caching
- **CDN** for static assets
- **Edge Caching** via Vercel/Cloudflare

### 5. Security Layers
```
┌─────────────────────────────────────┐
│  1. Edge: DDoS Protection           │
├─────────────────────────────────────┤
│  2. Gateway: Rate Limiting          │
├─────────────────────────────────────┤
│  3. Auth: JWT + RBAC                │
├─────────────────────────────────────┤
│  4. Data: RLS + Encryption          │
├─────────────────────────────────────┤
│  5. Audit: Comprehensive Logging    │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Examples

### Voice Call Flow
```
1. User initiates call → API Gateway
2. Gateway validates tenant & quota
3. Call Service creates session
4. Twilio connects call
5. STT (Deepgram) transcribes audio
6. LLM Router selects model
7. Memory Engine retrieves context
8. LLM generates response
9. TTS (ElevenLabs) converts to audio
10. Response streamed to user
11. Usage logged → Billing Service
12. Wallet deducted in real-time
13. Analytics updated
```

### Billing Deduction Flow
```
1. Call ends
2. Calculate duration & cost
3. Check wallet balance
4. Deduct from prepaid wallet
5. If balance < threshold → Alert
6. Log transaction
7. Update analytics
8. Generate usage record
```

## 🚀 Scalability Strategy

### Horizontal Scaling
- **Stateless Services**: All services can scale independently
- **Load Balancing**: Nginx/CloudFlare for distribution
- **Auto-scaling**: Based on CPU/Memory/Queue depth

### Database Scaling
- **Read Replicas**: For analytics and reporting
- **Connection Pooling**: PgBouncer
- **Partitioning**: Time-based for call logs
- **Archival**: Old data to cold storage

### Caching Layers
```
User Request
    ↓
CDN Cache (Edge)
    ↓
Redis Cache (Hot Data)
    ↓
Database (Source of Truth)
```

### Queue Management
- **Priority Queues**: Critical operations first
- **Dead Letter Queue**: Failed job handling
- **Rate Limiting**: Prevent system overload

## 🌍 Multi-Region Support

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   US-EAST    │     │   EU-WEST    │     │   AP-SOUTH   │
│              │     │              │     │              │
│  API Gateway │────▶│  API Gateway │────▶│  API Gateway │
│  App Servers │     │  App Servers │     │  App Servers │
│  Redis       │     │  Redis       │     │  Redis       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Global DB     │
                    │  (PostgreSQL)  │
                    │  Multi-region  │
                    └────────────────┘
```

## 🔐 Security Architecture

### Authentication Flow
```
1. User Login → Email/Password or OAuth
2. Verify credentials
3. Generate JWT (Access + Refresh)
4. Store session in Redis
5. Return tokens to client
6. Client includes token in all requests
7. Middleware validates token
8. Extract tenant context
9. Enforce RBAC
10. Allow/Deny request
```

### Data Encryption
- **At Rest**: AES-256 for sensitive data
- **In Transit**: TLS 1.3
- **Recordings**: Encrypted before S3 upload
- **Keys**: AWS KMS / Vault

## 📊 Monitoring & Observability

### Metrics to Track
- **System Health**: CPU, Memory, Disk, Network
- **API Performance**: Response time, Error rate
- **Business Metrics**: Calls/min, Revenue, Churn
- **User Experience**: Page load, API latency

### Logging Strategy
```
Application Logs → Winston
    ↓
Structured JSON
    ↓
Elasticsearch/CloudWatch
    ↓
Kibana/Grafana Dashboards
```

### Alerting
- **Critical**: System down, Payment failures
- **Warning**: High latency, Low balance
- **Info**: Deployments, Config changes

## 🛠️ Technology Stack Recommendation

### Core
- **Runtime**: Node.js 20+ (TypeScript)
- **Framework**: Next.js 14+ (App Router)
- **API Layer**: tRPC or REST
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash)
- **Queue**: BullMQ / Inngest

### AI Services
- **STT**: Deepgram / AssemblyAI
- **TTS**: ElevenLabs / PlayHT
- **LLM**: OpenAI, Groq, Anthropic
- **Vector DB**: Pinecone / Weaviate

### Infrastructure
- **Hosting**: Vercel (Frontend + API)
- **Workers**: Railway / Render
- **Storage**: AWS S3 / Cloudflare R2
- **CDN**: Cloudflare
- **Monitoring**: Sentry + Axiom

### Communication
- **Voice**: Twilio / Vonage
- **WhatsApp**: Twilio / MessageBird
- **SMS**: Twilio
- **Email**: Resend / SendGrid

### Payment
- **Global**: Stripe
- **India**: Razorpay
- **Crypto**: (Optional) Coinbase Commerce

## 🎨 White-Label Architecture

### Multi-Branding Strategy
```
tenant_settings
├── subdomain (customer.yourplatform.com)
├── custom_domain (voice.customer.com)
├── branding
│   ├── logo_url
│   ├── favicon_url
│   ├── primary_color
│   ├── secondary_color
│   └── css_overrides
└── whitelabel_enabled (boolean)
```

### Domain Routing
```
Request: voice.customer.com
    ↓
DNS CNAME → yourplatform.com
    ↓
Middleware extracts domain
    ↓
Query tenant by custom_domain
    ↓
Load tenant branding
    ↓
Inject CSS variables
    ↓
Render with custom branding
```

## 📦 Marketplace Architecture

### Agent Marketplace
```
marketplace_listings
├── agent_id
├── seller_id (user/workspace)
├── price (one-time or subscription)
├── revenue_share (platform %)
├── installs_count
├── rating
└── is_approved

marketplace_purchases
├── buyer_id
├── listing_id
├── amount_paid
├── platform_fee
├── seller_payout
└── created_at
```

### Revenue Split
- **70% to Seller**
- **30% to Platform**
- Monthly payouts via Stripe Connect

## 🔄 High Availability Strategy

### Redundancy
- **Multi-AZ Deployment**: Database across zones
- **Failover**: Auto-switch to replica
- **Health Checks**: Every 30s
- **Circuit Breakers**: Prevent cascade failures

### Disaster Recovery
- **Daily Backups**: Automated DB snapshots
- **Point-in-Time Recovery**: Last 30 days
- **Geo-Replication**: Critical data
- **RTO**: < 1 hour
- **RPO**: < 5 minutes

## 📈 Cost Optimization

### Strategies
1. **Auto-scaling**: Scale down during low traffic
2. **Spot Instances**: For non-critical workers
3. **Caching**: Reduce DB queries by 80%
4. **CDN**: Reduce bandwidth costs
5. **Compression**: Gzip/Brotli for all responses
6. **Query Optimization**: Indexed queries
7. **Connection Pooling**: Reduce DB connections

### Estimated Cost Structure
```
For 10,000 minutes/month:
- Deepgram STT: ~$120
- ElevenLabs TTS: ~$300
- OpenAI GPT-4: ~$400
- Twilio Voice: ~$10
- Infrastructure: ~$200
──────────────────────
Total: ~$1,030

Pricing: $0.15/min
Revenue: $1,500/month
Margin: ~31%
```

---

**Next Steps**: Proceed to Database Schema Design
