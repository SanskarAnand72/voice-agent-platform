# Folder Structure - Multi-Tenant Voice AI SaaS

## 📁 Project Structure

```
v_c-main/
├── 📄 Configuration Files
│   ├── .env.local
│   ├── .env.example
│   ├── .gitignore
│   ├── next.config.mjs
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── components.json
│   └── docker-compose.yml
│
├── 📂 app/ (Next.js App Router)
│   ├── layout.tsx
│   ├── page.tsx (Landing page)
│   ├── globals.css
│   │
│   ├── 🔐 (auth)/ (Auth routes - public)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── oauth/[provider]/callback/page.tsx
│   │
│   ├── 🏢 (dashboard)/ (Protected routes)
│   │   ├── layout.tsx (Sidebar, header)
│   │   ├── page.tsx (Dashboard home)
│   │   │
│   │   ├── workspace/
│   │   │   ├── page.tsx (Workspace overview)
│   │   │   ├── settings/page.tsx
│   │   │   ├── branding/page.tsx (White-label)
│   │   │   ├── team/page.tsx
│   │   │   └── integrations/page.tsx
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx (Agent list)
│   │   │   ├── new/page.tsx (Create agent)
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx (Agent dashboard)
│   │   │   │   ├── edit/page.tsx
│   │   │   │   ├── flows/page.tsx (Visual flow builder)
│   │   │   │   ├── test/page.tsx
│   │   │   │   └── analytics/page.tsx
│   │   │
│   │   ├── calls/
│   │   │   ├── page.tsx (Call history)
│   │   │   ├── [id]/page.tsx (Call details)
│   │   │   └── live/page.tsx (Active calls monitor)
│   │   │
│   │   ├── analytics/
│   │   │   ├── page.tsx (Overview)
│   │   │   ├── revenue/page.tsx
│   │   │   ├── performance/page.tsx
│   │   │   └── reports/page.tsx
│   │   │
│   │   ├── billing/
│   │   │   ├── page.tsx (Billing overview)
│   │   │   ├── wallet/page.tsx
│   │   │   ├── subscription/page.tsx
│   │   │   ├── invoices/page.tsx
│   │   │   └── usage/page.tsx
│   │   │
│   │   ├── marketplace/
│   │   │   ├── page.tsx (Browse)
│   │   │   ├── [id]/page.tsx (Listing detail)
│   │   │   ├── my-purchases/page.tsx
│   │   │   └── sell/
│   │   │       ├── page.tsx (My listings)
│   │   │       ├── new/page.tsx
│   │   │       └── earnings/page.tsx
│   │   │
│   │   ├── channels/
│   │   │   ├── page.tsx (Omnichannel overview)
│   │   │   ├── voice/page.tsx
│   │   │   ├── whatsapp/page.tsx
│   │   │   ├── sms/page.tsx
│   │   │   └── webchat/page.tsx
│   │   │
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── profile/page.tsx
│   │       ├── security/page.tsx
│   │       ├── notifications/page.tsx
│   │       └── api-keys/page.tsx
│   │
│   ├── 🌐 api/ (API Routes)
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   ├── verify-email/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   ├── reset-password/route.ts
│   │   │   └── oauth/[provider]/route.ts
│   │   │
│   │   ├── workspaces/
│   │   │   ├── route.ts (GET, POST)
│   │   │   └── [id]/
│   │   │       ├── route.ts (GET, PATCH, DELETE)
│   │   │       ├── settings/route.ts
│   │   │       ├── branding/route.ts
│   │   │       ├── members/route.ts
│   │   │       └── usage/route.ts
│   │   │
│   │   ├── agents/
│   │   │   ├── route.ts (GET, POST)
│   │   │   └── [id]/
│   │   │       ├── route.ts (GET, PATCH, DELETE)
│   │   │       ├── voice/route.ts
│   │   │       ├── llm/route.ts
│   │   │       ├── prompt/route.ts
│   │   │       ├── test/route.ts
│   │   │       ├── flows/route.ts
│   │   │       └── analytics/route.ts
│   │   │
│   │   ├── calls/
│   │   │   ├── route.ts (GET, POST)
│   │   │   ├── export/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts (GET, DELETE)
│   │   │       ├── transcript/route.ts
│   │   │       ├── recording/route.ts
│   │   │       ├── analytics/route.ts
│   │   │       ├── transfer/route.ts
│   │   │       └── feedback/route.ts
│   │   │
│   │   ├── billing/
│   │   │   ├── wallet/
│   │   │   │   ├── route.ts (GET)
│   │   │   │   ├── topup/route.ts
│   │   │   │   └── transactions/route.ts
│   │   │   ├── subscription/route.ts
│   │   │   ├── invoices/route.ts
│   │   │   ├── plans/route.ts
│   │   │   └── payment-methods/route.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── overview/route.ts
│   │   │   ├── calls/route.ts
│   │   │   ├── revenue/route.ts
│   │   │   └── export/route.ts
│   │   │
│   │   ├── marketplace/
│   │   │   ├── listings/route.ts
│   │   │   ├── featured/route.ts
│   │   │   ├── search/route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── purchase/route.ts
│   │   │       └── reviews/route.ts
│   │   │
│   │   ├── integrations/
│   │   │   ├── route.ts
│   │   │   ├── webhooks/route.ts
│   │   │   ├── slack/route.ts
│   │   │   └── zapier/route.ts
│   │   │
│   │   ├── channels/
│   │   │   ├── whatsapp/route.ts
│   │   │   ├── sms/route.ts
│   │   │   └── email/route.ts
│   │   │
│   │   ├── webhooks/ (Incoming from 3rd parties)
│   │   │   ├── twilio/route.ts
│   │   │   ├── stripe/route.ts
│   │   │   └── razorpay/route.ts
│   │   │
│   │   └── health/
│   │       ├── route.ts
│   │       ├── db/route.ts
│   │       └── redis/route.ts
│   │
│   ├── 🎨 (marketing)/ (Public marketing pages)
│   │   ├── layout.tsx
│   │   ├── pricing/page.tsx
│   │   ├── features/page.tsx
│   │   ├── about/page.tsx
│   │   ├── contact/page.tsx
│   │   ├── blog/
│   │   └── docs/
│   │
│   └── 🔌 (embed)/ (Embeddable widgets)
│       └── webchat/
│           └── [workspaceId]/page.tsx
│
├── 📂 components/
│   ├── ui/ (Shadcn components)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── table.tsx
│   │   └── ... (all UI primitives)
│   │
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── footer.tsx
│   │   └── workspace-switcher.tsx
│   │
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   ├── oauth-buttons.tsx
│   │   └── protected-route.tsx
│   │
│   ├── agents/
│   │   ├── agent-card.tsx
│   │   ├── agent-form.tsx
│   │   ├── agent-list.tsx
│   │   ├── voice-selector.tsx
│   │   ├── llm-selector.tsx
│   │   └── prompt-editor.tsx
│   │
│   ├── calls/
│   │   ├── call-card.tsx
│   │   ├── call-list.tsx
│   │   ├── call-details.tsx
│   │   ├── live-call-monitor.tsx
│   │   ├── transcript-viewer.tsx
│   │   └── audio-player.tsx
│   │
│   ├── flows/
│   │   ├── flow-builder.tsx (Visual flow editor)
│   │   ├── flow-node.tsx
│   │   ├── flow-edge.tsx
│   │   └── node-types/
│   │       ├── question-node.tsx
│   │       ├── condition-node.tsx
│   │       ├── api-call-node.tsx
│   │       └── transfer-node.tsx
│   │
│   ├── analytics/
│   │   ├── dashboard-cards.tsx
│   │   ├── charts/
│   │   │   ├── call-volume-chart.tsx
│   │   │   ├── revenue-chart.tsx
│   │   │   ├── sentiment-chart.tsx
│   │   │   └── heatmap.tsx
│   │   └── metrics/
│   │       ├── kpi-card.tsx
│   │       └── trend-indicator.tsx
│   │
│   ├── billing/
│   │   ├── wallet-card.tsx
│   │   ├── topup-dialog.tsx
│   │   ├── plan-selector.tsx
│   │   ├── invoice-list.tsx
│   │   └── usage-meter.tsx
│   │
│   ├── marketplace/
│   │   ├── listing-card.tsx
│   │   ├── listing-grid.tsx
│   │   ├── listing-detail.tsx
│   │   ├── purchase-dialog.tsx
│   │   └── review-form.tsx
│   │
│   └── shared/
│       ├── data-table.tsx
│       ├── loading-spinner.tsx
│       ├── empty-state.tsx
│       ├── error-boundary.tsx
│       ├── toast-notifications.tsx
│       └── theme-provider.tsx
│
├── 📂 lib/ (Core business logic)
│   ├── auth/
│   │   ├── jwt.ts
│   │   ├── session.ts
│   │   ├── rbac.ts (Role-based access control)
│   │   └── oauth-providers.ts
│   │
│   ├── database/
│   │   ├── client.ts (Supabase client)
│   │   ├── prisma.ts (or drizzle.ts)
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── services/
│   │   ├── workspace-service.ts
│   │   ├── agent-service.ts
│   │   ├── call-service.ts
│   │   ├── billing-service.ts
│   │   ├── analytics-service.ts
│   │   ├── marketplace-service.ts
│   │   └── notification-service.ts
│   │
│   ├── ai/
│   │   ├── llm-router.ts (Multi-model support)
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── groq.ts
│   │   │   ├── anthropic.ts
│   │   │   └── local-llm.ts
│   │   ├── voice/
│   │   │   ├── elevenlabs.ts
│   │   │   ├── playht.ts
│   │   │   └── azure-tts.ts
│   │   ├── stt/
│   │   │   ├── deepgram.ts
│   │   │   └── assemblyai.ts
│   │   └── memory/
│   │       ├── vector-db.ts (Pinecone)
│   │       ├── rag.ts
│   │       └── session-memory.ts
│   │
│   ├── telephony/
│   │   ├── twilio.ts
│   │   ├── call-control.ts
│   │   ├── sip-handler.ts
│   │   └── webrtc.ts
│   │
│   ├── billing/
│   │   ├── wallet.ts
│   │   ├── usage-tracker.ts
│   │   ├── invoice-generator.ts
│   │   └── payment-gateways/
│   │       ├── stripe.ts
│   │       └── razorpay.ts
│   │
│   ├── channels/
│   │   ├── whatsapp.ts
│   │   ├── sms.ts
│   │   ├── email.ts
│   │   └── webchat.ts
│   │
│   ├── integrations/
│   │   ├── webhooks.ts
│   │   ├── zapier.ts
│   │   └── slack.ts
│   │
│   ├── queue/
│   │   ├── bullmq.ts (or inngest.ts)
│   │   └── jobs/
│   │       ├── billing-job.ts
│   │       ├── analytics-job.ts
│   │       └── export-job.ts
│   │
│   ├── cache/
│   │   ├── redis.ts
│   │   └── cache-keys.ts
│   │
│   ├── storage/
│   │   ├── s3.ts
│   │   └── cloudflare-r2.ts
│   │
│   ├── monitoring/
│   │   ├── logger.ts (Winston)
│   │   ├── sentry.ts
│   │   └── metrics.ts
│   │
│   ├── utils/
│   │   ├── validation.ts (Zod schemas)
│   │   ├── formatting.ts
│   │   ├── encryption.ts
│   │   └── helpers.ts
│   │
│   └── constants/
│       ├── roles.ts
│       ├── permissions.ts
│       ├── plans.ts
│       └── error-codes.ts
│
├── 📂 types/
│   ├── index.ts
│   ├── database.ts
│   ├── api.ts
│   ├── models.ts
│   └── enums.ts
│
├── 📂 hooks/ (React hooks)
│   ├── use-workspace.ts
│   ├── use-auth.ts
│   ├── use-agents.ts
│   ├── use-calls.ts
│   ├── use-billing.ts
│   ├── use-toast.ts
│   ├── use-websocket.ts
│   └── use-realtime.ts
│
├── 📂 middleware/
│   ├── auth.ts
│   ├── rate-limit.ts
│   ├── workspace-context.ts
│   ├── error-handler.ts
│   └── logger.ts
│
├── 📂 workers/ (Background jobs)
│   ├── billing-worker.ts
│   ├── analytics-worker.ts
│   ├── export-worker.ts
│   └── notification-worker.ts
│
├── 📂 scripts/
│   ├── migrate.ts
│   ├── seed.ts
│   ├── generate-types.ts
│   └── backup-db.ts
│
├── 📂 public/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── static/
│
├── 📂 tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── helpers/
│
└── 📂 docs/
    ├── ARCHITECTURE.md ✅
    ├── DATABASE_SCHEMA.md ✅
    ├── API_STRUCTURE.md ✅
    ├── DEPLOYMENT.md
    ├── CONTRIBUTING.md
    └── CHANGELOG.md
```

## 🔧 Configuration Files

### .env.example
```bash
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="Voice AI Platform"

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/voiceai
DIRECT_URL=postgresql://user:password@localhost:5432/voiceai

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_EXPIRES_IN=30d

# AI Providers
OPENAI_API_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
DEEPGRAM_API_KEY=

# Telephony
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Payment
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=

# Vector DB
PINECONE_API_KEY=
PINECONE_ENVIRONMENT=

# Monitoring
SENTRY_DSN=
AXIOM_TOKEN=

# Email
RESEND_API_KEY=

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### package.json (Key Dependencies)
```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "typescript": "^5.5.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "drizzle-orm": "^0.33.0",
    "zod": "^3.23.0",
    "jose": "^5.6.0",
    "bcryptjs": "^2.4.3",
    "twilio": "^5.3.0",
    "stripe": "^16.12.0",
    "openai": "^4.65.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "groq-sdk": "^0.7.0",
    "@pinecone-database/pinecone": "^3.0.0",
    "bullmq": "^5.13.0",
    "ioredis": "^5.4.1",
    "@aws-sdk/client-s3": "^3.658.0",
    "winston": "^3.14.0",
    "@sentry/nextjs": "^8.33.0",
    "react-flow-renderer": "^10.3.17",
    "recharts": "^2.12.0",
    "sonner": "^1.5.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## 🚀 Key Features by Folder

### `/app/api/*` - API Layer
- RESTful endpoints
- Webhook handlers
- Real-time connections
- Rate limiting
- Authentication middleware

### `/lib/services/*` - Business Logic
- Workspace management
- Agent operations
- Call handling
- Billing & payments
- Analytics processing

### `/lib/ai/*` - AI Engine
- Multi-model LLM routing
- Voice synthesis (TTS)
- Speech recognition (STT)
- Memory & context management
- RAG implementation

### `/components/*` - UI Components
- Reusable UI primitives
- Feature-specific components
- Layout components
- Charts & visualizations

### `/workers/*` - Background Jobs
- Billing calculations
- Analytics aggregation
- Data exports
- Email notifications

---

**Next**: Implementation Plan
