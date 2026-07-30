# Scalability Strategy

## 🎯 Overview

This document outlines how to scale the Voice AI SaaS platform from **100 users to 100,000+ users** while maintaining performance, reliability, and cost efficiency.

---

## 📊 Scaling Metrics & Targets

### Performance Targets

| Metric | Target | Method |
|--------|--------|--------|
| API Response Time (p95) | < 200ms | Caching, DB optimization |
| Voice Call Latency | < 500ms | Edge deployment, Groq |
| Database Query Time | < 50ms | Indexing, read replicas |
| Page Load Time | < 2s | SSR, code splitting, CDN |
| Uptime | > 99.9% | Multi-region, redundancy |
| Error Rate | < 0.1% | Monitoring, circuit breakers |

### Scale Milestones

```
Phase 1: 0-100 users        (Weeks 1-4)
Phase 2: 100-1,000 users    (Months 2-3)
Phase 3: 1K-10K users       (Months 4-6)
Phase 4: 10K-100K users     (Months 7-12)
Phase 5: 100K+ users        (Year 2+)
```

---

## 🏗️ Horizontal Scaling Strategy

### Application Layer

#### Current Architecture (0-1K users)
```
┌─────────────┐
│   Vercel    │ (Auto-scales)
│  Next.js    │
│  Serverless │
└─────────────┘
```

#### Scale Architecture (1K-10K users)
```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Vercel #1   │    │  Vercel #2   │    │  Vercel #3   │
│  Edge Func   │    │  Edge Func   │    │  Edge Func   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼───────┐
                    │ Load Balancer│
                    │  (Cloudflare)│
                    └──────────────┘
```

#### Enterprise Architecture (10K+ users)
```
┌─────────────────────────────────────────────────────┐
│                  Global CDN (Cloudflare)             │
└────────────────────┬────────────────────────────────┘
                     │
     ┌───────────────┼───────────────┐
     │               │               │
┌────▼─────┐   ┌────▼─────┐   ┌────▼─────┐
│ US-EAST  │   │ EU-WEST  │   │ AP-SOUTH │
│ Region   │   │ Region   │   │ Region   │
└──────────┘   └──────────┘   └──────────┘
```

### Database Scaling

#### Phase 1: Single Instance (0-1K users)
```
┌──────────────────┐
│  PostgreSQL      │
│  (Supabase Pro)  │
│  4GB RAM         │
└──────────────────┘
```

#### Phase 2: Read Replicas (1K-10K users)
```
┌──────────────────┐
│  Primary DB      │ ◄─── Writes
│  (PostgreSQL)    │
└────────┬─────────┘
         │ Replication
    ┌────┼────┐
    │    │    │
┌───▼┐ ┌─▼─┐ ┌▼──┐
│ R1 │ │R2 │ │R3 │ ◄─── Reads
└────┘ └───┘ └───┘
```

**Benefits:**
- Distribute read load across replicas
- Analytics queries don't impact main DB
- Reporting without performance hit

**Implementation:**
```typescript
// lib/database/client.ts
import { Pool } from 'pg'

const primaryPool = new Pool({
  connectionString: process.env.DATABASE_URL
})

const readReplicaPools = [
  new Pool({ connectionString: process.env.READ_REPLICA_1_URL }),
  new Pool({ connectionString: process.env.READ_REPLICA_2_URL }),
]

export function getReadConnection() {
  const index = Math.floor(Math.random() * readReplicaPools.length)
  return readReplicaPools[index]
}

export function getWriteConnection() {
  return primaryPool
}
```

#### Phase 3: Sharding (10K+ users)
```
Hash(workspace_id) → Shard

Shard 1: workspaces A-F
Shard 2: workspaces G-M
Shard 3: workspaces N-S
Shard 4: workspaces T-Z
```

**Implementation:**
```typescript
function getShardForWorkspace(workspaceId: string) {
  const hash = hashCode(workspaceId)
  const shardIndex = hash % TOTAL_SHARDS
  return shards[shardIndex]
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}
```

#### Phase 4: Time-Based Partitioning
```sql
-- Partition calls table by month
CREATE TABLE calls_2026_01 PARTITION OF calls
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE calls_2026_02 PARTITION OF calls
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

-- Automatically create partitions
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  start_date date;
  end_date date;
  partition_name text;
BEGIN
  start_date := date_trunc('month', CURRENT_DATE);
  end_date := start_date + interval '1 month';
  partition_name := 'calls_' || to_char(start_date, 'YYYY_MM');
  
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF calls FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

---

## 🚀 Caching Strategy

### Multi-Layer Cache Architecture

```
Request
  ↓
1. Edge Cache (Cloudflare CDN) - 30s-5min
  ↓ (miss)
2. Application Cache (Redis) - 5min-1hr
  ↓ (miss)
3. Database Query Cache - 1hr-24hr
  ↓ (miss)
4. Database (Source of Truth)
```

### Cache Implementation

```typescript
// lib/cache/multi-layer.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

export async function getCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 300 // 5 minutes
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key)
  if (cached) {
    return JSON.parse(cached)
  }

  // Cache miss - fetch data
  const data = await fetchFn()
  
  // Store in cache
  await redis.setex(key, ttl, JSON.stringify(data))
  
  return data
}

// Usage
const agents = await getCached(
  `workspace:${workspaceId}:agents`,
  () => db.query.agents.findMany({ where: { workspaceId } }),
  600 // 10 minutes
)
```

### Cache Invalidation

```typescript
// lib/cache/invalidation.ts
export async function invalidateWorkspaceCache(workspaceId: string) {
  const patterns = [
    `workspace:${workspaceId}:*`,
    `agents:workspace:${workspaceId}:*`,
    `calls:workspace:${workspaceId}:*`,
  ]
  
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
}

// Call after mutations
await db.agents.create({ ... })
await invalidateWorkspaceCache(workspaceId)
```

### Smart Cache Keys

```typescript
// lib/cache/keys.ts
export const CacheKeys = {
  workspace: (id: string) => `workspace:${id}`,
  workspaceMembers: (id: string) => `workspace:${id}:members`,
  agents: (workspaceId: string) => `agents:workspace:${workspaceId}`,
  agent: (id: string) => `agent:${id}`,
  calls: (workspaceId: string, page: number) => 
    `calls:workspace:${workspaceId}:page:${page}`,
  analytics: (workspaceId: string, period: string) =>
    `analytics:workspace:${workspaceId}:${period}`,
}
```

---

## ⚡ Database Optimization

### Query Optimization

#### Before (Slow)
```typescript
// N+1 query problem
const agents = await db.query.agents.findMany()
for (const agent of agents) {
  agent.callCount = await db.query.calls.count({
    where: { agentId: agent.id }
  })
}
```

#### After (Fast)
```typescript
// Single query with aggregation
const agents = await db.execute(sql`
  SELECT 
    a.*,
    COUNT(c.id) as call_count
  FROM agents a
  LEFT JOIN calls c ON c.agent_id = a.id
  WHERE a.workspace_id = ${workspaceId}
  GROUP BY a.id
`)
```

### Index Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_calls_workspace_status_date 
  ON calls(workspace_id, status, started_at DESC);

CREATE INDEX idx_calls_agent_date 
  ON calls(agent_id, started_at DESC);

-- Partial indexes for active records
CREATE INDEX idx_active_agents 
  ON agents(workspace_id) 
  WHERE is_active = true AND deleted_at IS NULL;

-- JSONB indexes
CREATE INDEX idx_agent_metadata 
  ON agents USING gin(metadata);

-- Full-text search
CREATE INDEX idx_agents_fulltext 
  ON agents USING gin(to_tsvector('english', name || ' ' || description));
```

### Connection Pooling

```typescript
// lib/database/pool.ts
import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: 5432,
  
  // Pool configuration
  min: 10,              // Minimum connections
  max: 100,             // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Use PgBouncer for connection pooling at scale
```

---

## 🔄 Queue & Background Jobs

### BullMQ Configuration

```typescript
// lib/queue/config.ts
import { Queue, Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
})

// Billing queue
export const billingQueue = new Queue('billing', { 
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  }
})

// Worker for billing
const billingWorker = new Worker(
  'billing',
  async (job) => {
    switch (job.name) {
      case 'deduct-call-cost':
        return await deductCallCost(job.data)
      case 'generate-invoice':
        return await generateInvoice(job.data)
      case 'process-payment':
        return await processPayment(job.data)
    }
  },
  { 
    connection,
    concurrency: 10, // Process 10 jobs concurrently
  }
)
```

### Job Prioritization

```typescript
// High priority: Low balance alerts
await billingQueue.add(
  'low-balance-alert',
  { workspaceId },
  { priority: 1 }
)

// Medium priority: Billing
await billingQueue.add(
  'deduct-call-cost',
  { callId },
  { priority: 5 }
)

// Low priority: Analytics
await analyticsQueue.add(
  'update-analytics',
  { callId },
  { priority: 10 }
)
```

---

## 🌍 Multi-Region Deployment

### Geographic Distribution

```
User in US → Route to US-EAST
User in Europe → Route to EU-WEST
User in Asia → Route to AP-SOUTH
```

### Implementation

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const country = request.geo?.country || 'US'
  
  const regionMap: Record<string, string> = {
    'US': 'us-east-1',
    'CA': 'us-east-1',
    'GB': 'eu-west-1',
    'DE': 'eu-west-1',
    'FR': 'eu-west-1',
    'IN': 'ap-south-1',
    'SG': 'ap-southeast-1',
  }
  
  const region = regionMap[country] || 'us-east-1'
  
  // Store region in header for routing
  const response = NextResponse.next()
  response.headers.set('x-region', region)
  
  return response
}
```

### Database Replication

```
US-EAST (Primary)
    ↓ (streaming replication)
EU-WEST (Read Replica)
    ↓
AP-SOUTH (Read Replica)
```

---

## 📉 Cost Optimization

### Auto-Scaling Rules

```typescript
// workers/auto-scaler.ts
export async function scaleWorkers() {
  const queueSize = await billingQueue.count()
  const currentWorkers = await getWorkerCount()
  
  if (queueSize > 1000 && currentWorkers < 20) {
    await scaleUp(5) // Add 5 workers
  } else if (queueSize < 100 && currentWorkers > 5) {
    await scaleDown(3) // Remove 3 workers
  }
}

// Run every minute
setInterval(scaleWorkers, 60000)
```

### Database Query Budget

```typescript
// lib/database/query-budget.ts
const QUERY_BUDGET_PER_REQUEST = 10

export function withQueryBudget<T>(
  fn: () => Promise<T>
): Promise<T> {
  let queryCount = 0
  
  const originalQuery = db.query
  db.query = (...args) => {
    queryCount++
    if (queryCount > QUERY_BUDGET_PER_REQUEST) {
      throw new Error('Query budget exceeded')
    }
    return originalQuery(...args)
  }
  
  return fn().finally(() => {
    db.query = originalQuery
  })
}
```

### Resource Limits

```typescript
// lib/limits/resource-limits.ts
export const RESOURCE_LIMITS = {
  free: {
    agents: 3,
    calls_per_month: 100,
    minutes_per_month: 500,
    team_members: 2,
  },
  starter: {
    agents: 10,
    calls_per_month: 1000,
    minutes_per_month: 5000,
    team_members: 5,
  },
  pro: {
    agents: 50,
    calls_per_month: 10000,
    minutes_per_month: 50000,
    team_members: 25,
  },
  enterprise: {
    agents: Infinity,
    calls_per_month: Infinity,
    minutes_per_month: Infinity,
    team_members: Infinity,
  },
}

export async function checkLimit(
  workspaceId: string,
  resource: keyof typeof RESOURCE_LIMITS.free
) {
  const workspace = await getWorkspace(workspaceId)
  const plan = workspace.plan
  const limit = RESOURCE_LIMITS[plan][resource]
  const current = await getCurrentUsage(workspaceId, resource)
  
  if (current >= limit) {
    throw new Error(`${resource} limit reached`)
  }
}
```

---

## 🛡️ Resilience & Fault Tolerance

### Circuit Breaker Pattern

```typescript
// lib/resilience/circuit-breaker.ts
class CircuitBreaker {
  private failures = 0
  private lastFailTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'HALF_OPEN'
      } else {
        throw new Error('Circuit breaker is OPEN')
      }
    }
    
    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }
  
  private onSuccess() {
    this.failures = 0
    this.state = 'CLOSED'
  }
  
  private onFailure() {
    this.failures++
    this.lastFailTime = Date.now()
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN'
    }
  }
}

// Usage with OpenAI
const openaiCircuitBreaker = new CircuitBreaker()

export async function callOpenAI(prompt: string) {
  return openaiCircuitBreaker.execute(async () => {
    return await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    })
  })
}
```

### Graceful Degradation

```typescript
// lib/ai/llm-router-with-fallback.ts
export async function getLLMResponse(prompt: string) {
  try {
    // Try primary (OpenAI)
    return await callOpenAI(prompt)
  } catch (error) {
    console.error('OpenAI failed, falling back to Groq')
    
    try {
      // Fallback to Groq
      return await callGroq(prompt)
    } catch (error) {
      console.error('Groq failed, falling back to Anthropic')
      
      try {
        // Fallback to Anthropic
        return await callAnthropic(prompt)
      } catch (error) {
        // All providers failed
        throw new Error('All LLM providers unavailable')
      }
    }
  }
}
```

---

## 📊 Monitoring at Scale

### Metrics to Track

```typescript
// lib/monitoring/metrics.ts
import { Gauge, Counter, Histogram } from 'prom-client'

export const metrics = {
  // Request metrics
  httpRequestDuration: new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
  }),
  
  // Database metrics
  dbQueryDuration: new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries',
    labelNames: ['query_type'],
  }),
  
  dbConnectionPoolSize: new Gauge({
    name: 'db_connection_pool_size',
    help: 'Number of database connections',
  }),
  
  // Business metrics
  activeUsers: new Gauge({
    name: 'active_users_total',
    help: 'Number of active users',
  }),
  
  callsInProgress: new Gauge({
    name: 'calls_in_progress',
    help: 'Number of calls currently in progress',
  }),
  
  callsTotal: new Counter({
    name: 'calls_total',
    help: 'Total number of calls',
    labelNames: ['status', 'agent_id'],
  }),
  
  // Cost metrics
  aiCostTotal: new Counter({
    name: 'ai_cost_total_usd',
    help: 'Total AI service costs in USD',
    labelNames: ['provider', 'service'],
  }),
}

// Usage
metrics.httpRequestDuration.observe(
  { method: 'POST', route: '/api/calls', status: '200' },
  duration
)
```

---

## 🎯 Performance Benchmarks

### Target Performance

| Scale | Users | Requests/sec | DB Connections | Workers |
|-------|-------|--------------|----------------|---------|
| Small | 100 | 10 | 10 | 2 |
| Medium | 1,000 | 100 | 50 | 10 |
| Large | 10,000 | 1,000 | 200 | 50 |
| Enterprise | 100,000+ | 10,000+ | 1,000+ | 200+ |

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

```javascript
// tests/load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 500 },   // Ramp up to 500 users
    { duration: '5m', target: 500 },   // Stay at 500 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
}

export default function () {
  const res = http.get('https://yourapp.com/api/agents')
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  sleep(1)
}
```

---

## ✅ Scalability Checklist

### Before Scaling
- [ ] Database indexes optimized
- [ ] Queries use proper joins (no N+1)
- [ ] Caching implemented (Redis)
- [ ] Connection pooling configured
- [ ] Background jobs use queues
- [ ] Rate limiting in place
- [ ] Monitoring & alerts set up
- [ ] Load tests performed
- [ ] Auto-scaling configured
- [ ] Multi-region ready (if needed)

### Ongoing
- [ ] Monitor database query performance weekly
- [ ] Review slow query logs
- [ ] Analyze cache hit rates
- [ ] Optimize expensive API endpoints
- [ ] Review and archive old data
- [ ] Update database statistics
- [ ] Scale database resources as needed
- [ ] Review and optimize costs monthly

---

**Scalability strategy complete!** 🚀

Your platform is now ready to scale from 0 to 100K+ users efficiently.
