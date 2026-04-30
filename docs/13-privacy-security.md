# Privacy & Security

---

## 1. Data Flow Guarantees

| Data | Stored Where | Leaves Browser? |
|------|--------------|-----------------|
| Full document content | Browser (memory only) | **NEVER** |
| Parsed page text | IndexedDB (browser) | **NO** |
| Chunk embeddings | IndexedDB (browser) | **NO** |
| Retrieved chunks (for AI) | Sent to Gemini/Ollama only | **YES (partial)** |
| Gemini API keys | Supabase (encrypted) | Server-side only |
| Chat / node history | IndexedDB (+ optional Supabase) | Optional |

---

## 2. Privacy Principles

### 2.1 Client-First Processing

**Principle**: All document processing happens in the browser.

**Implementation**:
- pdf.js, mammoth.js, pptx2json run client-side
- Transformers.js embedding runs in Web Worker (WASM)
- No file upload endpoints exist
- Network audit: Zero POST requests with file data

**Verification**:
```javascript
// In browser console:
performance.getEntriesByType('resource')
  .filter(r => r.initiatorType === 'fetch' && r.transferSize > 100000)
// Should return empty array (no large uploads)
```

### 2.2 Minimal Data Transmission

**What is sent to AI**:
- ✅ Retrieved text chunks (max 3,000 tokens)
- ✅ User's question (max 200 tokens)
- ✅ Chat history (last 6 turns, max 800 tokens)

**What is NOT sent**:
- ❌ Full document
- ❌ All chunks
- ❌ Embeddings
- ❌ File metadata (filename, size, etc.)

### 2.3 Optional Cloud Sync

**Default**: All data stays in browser (IndexedDB)

**Optional**: User can enable cloud sync for:
- Node graph (Q&A history)
- Memory system (weak areas)
- Settings

**User control**:
```
Settings → Data & Privacy → Cloud Sync
☐ Sync my Q&A history to cloud
☐ Sync my memory/weak areas to cloud
```

---

## 3. Security Measures

### 3.1 API Key Encryption

**Storage**:
```sql
-- Encrypted at rest using pgcrypto
CREATE TABLE user_settings (
  gemini_keys_encrypted TEXT  -- pgp_sym_encrypt(keys_json, app_secret)
);
```

**Encryption**:
```javascript
// Server-side only (Next.js API route)
const encrypted = await db.query(`
  SELECT pgp_sym_encrypt($1, $2) AS encrypted
`, [keysJson, process.env.APP_SECRET]);
```

**Decryption**:
```javascript
// Server-side only (Next.js API route)
const decrypted = await db.query(`
  SELECT pgp_sym_decrypt($1, $2) AS decrypted
`, [encryptedKeys, process.env.APP_SECRET]);
```

**Key never exposed to browser**:
- Browser sends encrypted blob to server
- Server decrypts, uses key, returns result
- Browser never sees plaintext key

### 3.2 Data Isolation (No RLS)

**No Row Level Security** is used since there is no user authentication. Instead, all tables use a `user_id TEXT` column populated with the browser's device ID. The server filters all queries by this device ID:

```sql
-- All queries filtered by device_id (no auth.uid())
SELECT * FROM user_settings WHERE user_id = :device_id;
```

**Applied to**:
- ✅ user_settings (device_id filtered)
- ✅ api_key_usage (device_id filtered)
- ✅ node_graph_sync (device_id filtered)
- ✅ chat_sessions (device_id filtered)
- ✅ messages (device_id filtered)
- ✅ user_memory (device_id filtered)

### 3.3 No Login Required

This application has **no authentication system**. All API routes are open. Users are identified by a device/session ID generated locally in the browser. No email, password, or OAuth credentials are collected.

### 3.4 HTTPS Enforcement

**Vercel default**:
- All traffic over HTTPS
- HTTP → HTTPS redirect automatic
- TLS 1.3 enabled

**Supabase**:
- All connections over HTTPS
- Certificate pinning (optional)

---

## 4. Threat Model

### 4.1 Threats We Protect Against

| Threat | Mitigation |
|--------|------------|
| Document theft | Files never leave browser |
| API key theft | Encrypted at rest, never exposed to browser |
| XSS attacks | CSP headers |
| Man-in-the-middle | HTTPS only, TLS 1.3 |
| SQL injection | Parameterized queries |

### 4.2 Threats Outside Scope (V1)

| Threat | Status |
|--------|--------|
| Browser compromise | User responsibility (keep browser updated) |
| Gemini API logging | Google's privacy policy applies |
| Local device theft | User should use device encryption |
| Malicious browser extensions | User responsibility |

---

## 5. Compliance

### 5.1 GDPR Compliance

**Right to access**:
- User can export all data (Settings → Export Data)

**Right to erasure**:
- User can delete cloud data (Settings → Delete All Cloud Data)
- Cascade delete: all user data removed from Supabase
- IndexedDB cleared automatically

**Data minimization**:
- No user accounts or personal data collected
- No tracking, analytics, or telemetry (V1)

**Consent**:
- Cloud sync opt-in (default: off)
- Clear privacy notice on first use

### 5.2 Data Retention

| Data | Retention |
|------|-----------|
| IndexedDB (local) | Until user clears browser data |
| Supabase (cloud sync) | Until user deletes cloud data |
| API logs (Vercel) | 7 days (Vercel default) |
| Gemini API logs | Per Google's policy |

---

## 6. Security Audit Checklist

### Pre-Launch Audit

- [ ] API keys encrypted with pgcrypto
- [ ] No file upload endpoints exist
- [ ] HTTPS enforced (Vercel default)
- [ ] CSP headers configured
- [ ] SQL queries parameterized
- [ ] No secrets in client-side code
- [ ] Environment variables secured (Vercel)
- [ ] Dependency audit (npm audit)
- [ ] Penetration testing (optional)

### Post-Launch Monitoring

- [ ] Monitor Vercel logs for 401/403 errors
- [ ] Monitor Supabase for RLS violations
- [ ] Monitor API key usage for anomalies
- [ ] Regular dependency updates (Dependabot)
- [ ] Security headers check (securityheaders.com)

---

## 7. Incident Response Plan

### 7.1 API Key Compromise

**Detection**:
- Unusual request patterns
- User reports unauthorized usage

**Response**:
1. Immediately mark key as invalid in database
2. Notify user via email
3. Force key rotation
4. Investigate source of compromise
5. Update security measures if needed

### 7.2 Data Breach

**Detection**:
- Unauthorized access to Supabase
- RLS policy violation logs

**Response**:
1. Immediately revoke compromised credentials
2. Notify affected users within 72 hours (GDPR)
3. Investigate breach source
4. Implement additional security measures
5. Public disclosure if required by law

---

## 8. User Privacy Controls

### 8.1 Settings Page

```
┌─────────────────────────────────────────┐
│ Privacy & Data                          │
├─────────────────────────────────────────┤
│ Cloud Sync:                             │
│   ☐ Sync Q&A history                    │
│   ☐ Sync memory/weak areas              │
│                                         │
│ Data Management:                        │
│   [Export All Data]                     │
│   [Clear Local Data]                    │
│   [Delete All Cloud Data]               │
│                                         │
│ Privacy Policy: [View]                  │
│ Terms of Service: [View]                │
└─────────────────────────────────────────┘
```

### 8.2 Transparency

**Privacy Policy includes**:
- What data we collect (email only)
- What data stays local (documents, chunks, embeddings)
- What data is sent to third parties (chunks to Gemini/Ollama)
- How API keys are stored (encrypted)
- User rights (access, erasure, portability)

---

**Next**: See `14-success-metrics.md` for KPIs and monitoring.
