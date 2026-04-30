# Security Implementation Guide

This document provides concrete implementation details for the security measures outlined in `13-privacy-security.md`.

---

## 1. Content Security Policy (CSP)

### Next.js Configuration

Add to `next.config.js`:

```javascript
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.google.com https://*.supabase.co http://localhost:11434;
  frame-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Why These Headers Matter

| Header | Protection |
|--------|------------|
| CSP | Prevents XSS by controlling resource loading |
| X-Frame-Options | Prevents clickjacking attacks |
| X-Content-Type-Options | Prevents MIME-type sniffing |
| Referrer-Policy | Limits information leakage via referrer |
| Permissions-Policy | Disables unnecessary browser features |
| HSTS | Enforces HTTPS connections |

---

## 2. API Key Encryption Implementation

### Server-Side Encryption (Next.js API Route)

```typescript
// app/api/keys/add/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { gemini_keys } = await request.json();
  
  // Validate keys format
  if (!Array.isArray(gemini_keys) || gemini_keys.length === 0) {
    return NextResponse.json({ error: 'Invalid keys format' }, { status: 400 });
  }

  // Validate each key format (Gemini keys start with "AIza")
  const invalidKeys = gemini_keys.filter(key => !key.startsWith('AIza'));
  if (invalidKeys.length > 0) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
  }

  const keysJson = JSON.stringify(gemini_keys);
  
  // Encrypt using pgcrypto
  const { data, error } = await supabase.rpc('encrypt_api_keys', {
    user_id: getDeviceId(), // device/session identifier from cookie/localStorage
    keys_json: keysJson
  });

  if (error) {
    console.error('Encryption error:', error);
    return NextResponse.json({ error: 'Failed to save keys' }, { status: 500 });
  }

  return NextResponse.json({ success: true, key_count: gemini_keys.length });
}
```

### Supabase Function for Encryption

```sql
-- Create encryption function
CREATE OR REPLACE FUNCTION encrypt_api_keys(
  user_id UUID,
  keys_json TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_settings (user_id, gemini_keys_encrypted, updated_at)
  VALUES (
    user_id,
    pgp_sym_encrypt(keys_json, current_setting('app.encryption_secret')),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    gemini_keys_encrypted = pgp_sym_encrypt(keys_json, current_setting('app.encryption_secret')),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Decryption for API Calls

```typescript
// app/api/chat/route.ts
async function getDecryptedKeys(userId: string): Promise<string[]> {
  const supabase = createServerClient();
  
  const { data, error } = await supabase.rpc('decrypt_api_keys', {
    user_id: userId
  });

  if (error || !data) {
    throw new Error('Failed to retrieve API keys');
  }

  return JSON.parse(data);
}
```

```sql
-- Create decryption function
CREATE OR REPLACE FUNCTION decrypt_api_keys(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  decrypted_keys TEXT;
BEGIN
  SELECT pgp_sym_decrypt(
    gemini_keys_encrypted::bytea,
    current_setting('app.encryption_secret')
  )
  INTO decrypted_keys
  FROM user_settings
  WHERE user_settings.user_id = decrypt_api_keys.user_id;
  
  RETURN decrypted_keys;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Setting Encryption Secret

```bash
# In Supabase Dashboard → Project Settings → Database → Custom Postgres Configuration
ALTER DATABASE postgres SET app.encryption_secret TO 'your-strong-secret-key-here';
```

**CRITICAL**: Store the encryption secret in:
1. Supabase custom config (as shown above)
2. Environment variable backup: `ENCRYPTION_SECRET` in Vercel
3. Secure password manager for disaster recovery

---

## 3. Input Validation & Sanitization

### API Route Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod';

export const ChatRequestSchema = z.object({
  node_id: z.string().uuid(),
  question: z.string().min(1).max(500),
  context_chunks: z.array(z.object({
    chunk_id: z.string(),
    text: z.string().max(2000),
    page_number: z.number().int().positive(),
    section_title: z.string().optional()
  })).max(10),
  chat_history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000)
  })).max(12),
  answering_mode: z.enum(['strict', 'assist', 'hybrid']),
  stream: z.boolean(),
  parent_answer: z.string().max(2000).nullable().optional()
});

export const NodeSaveSchema = z.object({
  node_id: z.string().uuid(),
  parent_id: z.string().uuid().nullable(),
  doc_id: z.string().min(1).max(100),
  doc_name: z.string().min(1).max(255),
  page_number: z.number().int().positive(),
  question: z.string().min(1).max(500),
  answer: z.string().max(5000),
  confidence_score: z.number().min(0).max(1),
  model_used: z.string().max(50),
  depth: z.number().int().min(0).max(4),
  created_at: z.string().datetime()
});
```

### Usage in API Routes

```typescript
// app/api/chat/route.ts
import { ChatRequestSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate input
  const validation = ChatRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ 
      error: 'Invalid request', 
      details: validation.error.issues 
    }, { status: 400 });
  }

  const { node_id, question, context_chunks, answering_mode, stream } = validation.data;
  
  // Proceed with validated data...
}
```

---

## 4. Rate Limiting

### API Route Rate Limiting

```typescript
// lib/rate-limit.ts
import { LRUCache } from 'lru-cache';

type RateLimitOptions = {
  interval: number;
  uniqueTokenPerInterval: number;
};

export function rateLimit(options: RateLimitOptions) {
  const tokenCache = new LRUCache({
    max: options.uniqueTokenPerInterval || 500,
    ttl: options.interval || 60000,
  });

  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const tokenCount = (tokenCache.get(token) as number[]) || [0];
        if (tokenCount[0] === 0) {
          tokenCache.set(token, tokenCount);
        }
        tokenCount[0] += 1;

        const currentUsage = tokenCount[0];
        const isRateLimited = currentUsage >= limit;

        return isRateLimited ? reject() : resolve();
      }),
  };
}

// Create limiters for different endpoints
export const chatLimiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export const embedLimiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});
```

### Usage in API Routes

```typescript
// app/api/chat/route.ts
import { chatLimiter } from '@/lib/rate-limit';

export async function POST(request: Request) {
  // Use device ID for per-client rate limiting
  const deviceId = request.headers.get('x-device-id') || 'anonymous';

  // Rate limit: 30 requests per minute per device
  try {
    await chatLimiter.check(30, deviceId);
  } catch {
    return NextResponse.json({ 
      error: 'Rate limit exceeded',
      retry_after: 60 
    }, { status: 429 });
  }

  // Proceed with request...
}
```

---

## 5. SQL Injection Prevention

### Always Use Parameterized Queries

```typescript
// ❌ NEVER DO THIS (vulnerable to SQL injection)
const { data } = await supabase
  .from('node_graph_sync')
  .select('*')
  .eq('doc_id', userInput); // If userInput contains SQL, it could be executed

// ✅ CORRECT (Supabase client automatically parameterizes)
const { data } = await supabase
  .from('node_graph_sync')
  .select('*')
  .eq('doc_id', userInput); // Safe - Supabase handles parameterization

// ✅ CORRECT (Using RPC with parameters)
const { data } = await supabase.rpc('get_user_nodes', {
  p_user_id: userId,
  p_doc_id: docId
});
```

### Supabase RPC Functions (Parameterized)

```sql
-- Safe parameterized function
CREATE OR REPLACE FUNCTION get_user_nodes(
  p_user_id UUID,
  p_doc_id TEXT,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  node_id UUID,
  question TEXT,
  answer TEXT,
  confidence_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.node_id,
    n.question,
    n.answer,
    n.confidence_score
  FROM node_graph_sync n
  WHERE n.user_id = p_user_id
    AND n.doc_id = p_doc_id
  ORDER BY n.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. XSS Prevention

### React Automatic Escaping

React automatically escapes content rendered in JSX:

```tsx
// ✅ Safe - React escapes by default
<div>{userQuestion}</div>
<p>{aiAnswer}</p>

// ❌ DANGEROUS - Bypasses React escaping
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### Sanitize HTML if Needed

If you must render HTML (e.g., for markdown), use a sanitizer:

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}
```

```tsx
// components/NodeCard.tsx
import { sanitizeHTML } from '@/lib/sanitize';

export function NodeCard({ answer }: { answer: string }) {
  const cleanAnswer = sanitizeHTML(answer);
  
  return (
    <div dangerouslySetInnerHTML={{ __html: cleanAnswer }} />
  );
}
```

---

## 7. CSRF Protection

Since this application has **no login, no session cookies, and no form-based authentication**, traditional CSRF attacks are not applicable. There are no auth tokens to steal via cross-site requests.

For any state-modifying API routes that could be sensitive (e.g., deleting cloud data), requests should include the device ID header as a basic identifier:

```typescript
// Include device ID in all API requests
fetch('/api/user/delete', {
  method: 'DELETE',
  headers: {
    'x-device-id': getDeviceId()
  }
});
```

---

## 8. Session Management

This application has **no login or authentication system**. There are no session tokens, JWTs, or auth cookies to manage. Users are identified by a device ID generated and stored in the browser (e.g., `localStorage`).

### Device ID Generation

```typescript
// lib/device-id.ts
export function getDeviceId(): string {
  let id = localStorage.getItem('doculearn_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('doculearn_device_id', id);
  }
  return id;
}
```

---

## 9. Dependency Security

### Automated Scanning

```json
// package.json
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "security:check": "npm run audit && npm outdated"
  }
}
```

### GitHub Dependabot Configuration

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"
```

### Pre-commit Hook for Security

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ Security vulnerabilities found. Fix them before committing."
  exit 1
fi
```

---

## 10. Logging & Monitoring

### Security Event Logging

```typescript
// lib/security-logger.ts
import { createServerClient } from '@/lib/supabase-server';

export async function logSecurityEvent(event: {
  user_id: string;
  event_type: 'rate_limit' | 'invalid_input' | 'key_rotation';
  details: Record<string, any>;
  ip_address?: string;
}) {
  const supabase = createServerClient();
  
  await supabase.from('security_logs').insert({
    user_id: event.user_id,
    event_type: event.event_type,
    details: event.details,
    ip_address: event.ip_address,
    timestamp: new Date().toISOString()
  });
}
```

### Security Logs Table

```sql
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,      -- device/session identifier
  event_type TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Index for querying
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp DESC);
```

### Monitoring Dashboard Queries

```sql
-- Rate limit violations
SELECT user_id, COUNT(*) as violations
FROM security_logs
WHERE event_type = 'rate_limit'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY violations DESC;
```

---

## 11. Incident Response Procedures

### API Key Compromise Response

```typescript
// app/api/keys/revoke-all/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient();
  const deviceId = request.headers.get('x-device-id') || 'anonymous';

  // Log security event
  await logSecurityEvent({
    user_id: deviceId,
    event_type: 'key_rotation',
    details: { reason: 'user_initiated_revoke_all' }
  });

  // Mark all keys as invalid
  await supabase
    .from('api_key_usage')
    .update({ status: 'invalid', last_error: 'Revoked by user' })
    .eq('user_id', deviceId);

  // Clear encrypted keys
  await supabase
    .from('user_settings')
    .update({ gemini_keys_encrypted: null })
    .eq('user_id', deviceId);

  return NextResponse.json({ success: true });
}
```

### Automated Anomaly Detection

```typescript
// lib/anomaly-detection.ts
export async function detectAnomalies(userId: string) {
  const supabase = createServerClient();
  
  // Check for unusual request patterns
  const { data: recentRequests } = await supabase
    .from('api_key_usage')
    .select('request_count, last_used')
    .eq('user_id', userId)
    .gte('last_used', new Date(Date.now() - 3600000).toISOString());

  if (!recentRequests) return;

  const totalRequests = recentRequests.reduce((sum, r) => sum + r.request_count, 0);
  
  // Alert if > 1000 requests in 1 hour (possible abuse)
  if (totalRequests > 1000) {
    await logSecurityEvent({
      user_id: userId,
      event_type: 'rate_limit',
      details: { 
        reason: 'anomaly_detected',
        request_count: totalRequests,
        time_window: '1_hour'
      }
    });
    
    // Optionally: temporarily block device ID
    // await supabase.from('blocked_devices').insert({ device_id: payload.user_id });
  }
}
```

---

## 12. Pre-Launch Security Checklist

### Code Review Checklist

- [ ] All Supabase tables do NOT have user-blocking RLS policies (no login)
- [ ] API keys encrypted with pgcrypto
- [ ] Input validation on all API endpoints (using Zod)
- [ ] Rate limiting implemented on all API routes
- [ ] CSP headers configured in next.config.js
- [ ] HTTPS enforced (Vercel default)
- [ ] No secrets in client-side code
- [ ] Environment variables secured in Vercel
- [ ] SQL queries parameterized (no string concatenation)
- [ ] XSS protection (React escaping + DOMPurify for HTML)
- [ ] Dependency audit passing (npm audit)
- [ ] Security logging implemented
- [ ] Incident response procedures documented

### Infrastructure Checklist

- [ ] Supabase RLS tested for all tables
- [ ] Encryption secret stored securely
- [ ] Vercel environment variables configured
- [ ] Domain HTTPS certificate valid
- [ ] Supabase connection pooling enabled
- [ ] Database backups configured (Supabase default)
- [ ] Monitoring alerts configured
- [ ] Security headers verified (securityheaders.com)

### Testing Checklist

- [ ] Penetration testing completed (optional but recommended)
- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] CSRF tests (N/A - no cookies used)
- [ ] Rate limiting tests passed
- [ ] API key encryption/decryption tested
- [ ] Incident response procedures tested

---

## 13. Ongoing Security Maintenance

### Weekly Tasks

- [ ] Review security logs for anomalies
- [ ] Check Dependabot alerts
- [ ] Monitor rate limit violations

### Monthly Tasks

- [ ] Run full security audit (npm audit)
- [ ] Review and update dependencies
- [ ] Test incident response procedures
- [ ] Review access logs for unusual patterns
- [ ] Verify backup integrity

### Quarterly Tasks

- [ ] Security headers audit (securityheaders.com)
- [ ] Penetration testing (if budget allows)
- [ ] Review and update security policies
- [ ] Team security training
- [ ] Disaster recovery drill

---

**Next**: Integrate these implementations into your codebase during development phases outlined in `10-build-plan.md`.
