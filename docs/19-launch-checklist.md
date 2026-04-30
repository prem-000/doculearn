# DocuLearn AI — Launch Checklist

**Version**: 1.0  
**Last Updated**: 2025  
**Purpose**: Pre-launch readiness verification for V1 public release

---

## Overview

This document serves as the definitive go/no-go checklist before the public V1 launch of DocuLearn AI. Each item must be explicitly verified and signed off. Items marked 🔴 are launch blockers. Items marked 🟡 are strongly recommended. Items marked 🟢 are nice-to-have.

---

## 1. Core Functionality

### 1.1 Document Processing

- [ ] 🔴 PDF upload and rendering works (pdf.js, lazy loading)
- [ ] 🔴 Text extraction produces correct chunks (sliding window, ~350 tokens)
- [ ] 🔴 Tables, figures, math formulas chunked correctly
- [ ] 🔴 Heading extraction produces hierarchy (H1 → H4)
- [ ] 🔴 doc_id hash is stable across sessions for the same file
- [ ] 🔴 Documents > 200 pages show appropriate warning
- [ ] 🟡 DOCX / TXT fallback processing works
- [ ] 🟡 File already indexed detection (skip re-embedding)

### 1.2 Embedding Pipeline

- [ ] 🔴 Web Worker starts without crashing on Chrome, Firefox, Edge, Safari
- [ ] 🔴 all-MiniLM-L6-v2 model loads from Transformers.js
- [ ] 🔴 Embeddings stored in IndexedDB successfully
- [ ] 🔴 Incremental indexing priority queue works (current page first)
- [ ] 🔴 Worker progress events fire correctly (UI progress bar updates)
- [ ] 🔴 Chatbot unlocks after positional phase completes (< 2s)
- [ ] 🟡 Embedding throughput ≥ 5 chunks/sec on mid-range hardware
- [ ] 🟡 Worker recovers gracefully from tab backgrounding

### 1.3 RAG Pipeline

- [ ] 🔴 Positional retrieval (N±1) works correctly
- [ ] 🔴 Semantic retrieval (cosine similarity) returns correct top-K chunks
- [ ] 🔴 Hierarchical retrieval (heading context) appended correctly
- [ ] 🔴 Dual merge algorithm deduplicates chunks correctly
- [ ] 🔴 Confidence scoring (0.0–1.0) computed correctly
- [ ] 🔴 Strict mode only answers from document context
- [ ] 🔴 Hybrid mode falls back to general AI when confidence < 0.5
- [ ] 🟡 Semantic search on 500-chunk doc completes in < 200ms

### 1.4 AI & Chat

- [ ] 🔴 Gemini API integration works (streaming tokens)
- [ ] 🔴 First AI token appears within 3 seconds
- [ ] 🔴 Key chaining rotates to next key on rate limit / exhaustion
- [ ] 🔴 Ollama fallback triggers when Gemini unavailable
- [ ] 🔴 Source chunks highlighted in viewer after each answer
- [ ] 🔴 Confidence badge displayed with each answer
- [ ] 🟡 Follow-up questions inherit parent context correctly
- [ ] 🟡 Highlight-to-ask feature works on selected text

---

## 2. Doubt Graph System

- [ ] 🔴 Root node created on first question
- [ ] 🔴 Child nodes branch from root correctly
- [ ] 🔴 Graph stored in IndexedDB (persists across sessions)
- [ ] 🔴 Graph synced to Supabase (optional, cloud backup)
- [ ] 🔴 Node states render correctly (answered, pending, error)
- [ ] 🟡 Top-down graph layout renders without overlap
- [ ] 🟡 Graph export (PNG / JSON) works
- [ ] 🟢 Radial graph layout as alternate visualization

---

## 3. Exam Mode

- [ ] 🔴 MCQ generation edge function returns valid questions
- [ ] 🔴 MCQ generation completes in < 5 seconds
- [ ] 🔴 Exam session timer works correctly
- [ ] 🔴 Results page shows score, correct/incorrect breakdown
- [ ] 🟡 Key Concepts summary generation works
- [ ] 🟡 Chapter summary generation works
- [ ] 🟢 Exam history persisted in IndexedDB

---

## 4. Memory System

- [ ] 🔴 Memory scores updated after each answered question
- [ ] 🔴 Weak areas identified correctly (score < 0.4)
- [ ] 🟡 Memory dashboard displays weak topics clearly
- [ ] 🟡 Memory data synced to Supabase (device_id keyed)
- [ ] 🟢 Spaced repetition scheduling functional

---

## 5. Privacy & Security

### 5.1 Data Privacy

- [ ] 🔴 Zero document uploads confirmed (network audit — no file POSTs to server)
- [ ] 🔴 Document content never sent to server (only text chunks for AI calls)
- [ ] 🔴 Document filenames never logged in analytics or server-side
- [ ] 🔴 Anonymous device ID generated locally (no PII)
- [ ] 🔴 Privacy Policy page live and accessible
- [ ] 🔴 Cookie Policy page live and accessible
- [ ] 🔴 Terms of Service page live and accessible
- [ ] 🟡 Privacy dashboard allows data export (JSON)
- [ ] 🟡 Privacy dashboard allows full local data deletion

### 5.2 API Key Security

- [ ] 🔴 Server-side Gemini keys stored in Supabase Vault (not .env plain text)
- [ ] 🔴 Keys encrypted with pgcrypto at rest
- [ ] 🔴 Keys never exposed in API responses or client-side code
- [ ] 🔴 User-supplied BYO keys stored in localStorage (never sent to server)
- [ ] 🔴 Key rotation works without session interruption

### 5.3 Security Headers & Hardening

- [ ] 🔴 Content-Security-Policy header set correctly
- [ ] 🔴 X-Frame-Options: DENY set
- [ ] 🔴 X-Content-Type-Options: nosniff set
- [ ] 🔴 Referrer-Policy: strict-origin-when-cross-origin set
- [ ] 🔴 HTTPS enforced (Vercel automatic TLS)
- [ ] 🔴 All API inputs validated with Zod schemas
- [ ] 🔴 SQL injection impossible (parameterized queries only)
- [ ] 🟡 Dependabot / npm audit shows zero critical vulnerabilities

### 5.4 Rate Limiting

- [ ] 🔴 /api/chat rate limited (20 req/min per device)
- [ ] 🔴 /api/exam/generate rate limited (5 req/min per device)
- [ ] 🔴 Rate limit headers returned (X-RateLimit-Remaining)
- [ ] 🔴 429 responses handled gracefully in UI (user message shown)

---

## 6. Performance

| Check | Target | Status |
|-------|--------|--------|
| Time to first answer | < 2 seconds | ☐ |
| Page navigation speed | < 100ms | ☐ |
| Embedding throughput | ≥ 5 chunks/sec | ☐ |
| MCQ generation | < 5 seconds | ☐ |
| IndexedDB read (1000 chunks) | < 50ms | ☐ |
| First page render (pdf.js) | < 1 second | ☐ |
| First AI token (streaming) | < 3 seconds | ☐ |
| Lighthouse Performance | > 90 | ☐ |
| Lighthouse Accessibility | > 90 | ☐ |
| Lighthouse Best Practices | > 90 | ☐ |
| Lighthouse SEO | > 90 | ☐ |
| Lighthouse PWA | Installable | ☐ |

---

## 7. Browser & Device Compatibility

### 7.1 Desktop Browsers

- [ ] 🔴 Chrome 120+ — full functionality
- [ ] 🔴 Firefox 120+ — full functionality
- [ ] 🔴 Edge 120+ — full functionality
- [ ] 🟡 Safari 17+ — full functionality (IndexedDB + Web Workers)
- [ ] 🟡 Arc Browser — basic functionality

### 7.2 Mobile Browsers

- [ ] 🔴 Chrome for Android (Android 12+) — responsive UI, core features
- [ ] 🔴 Safari for iOS (iOS 16+) — responsive UI, core features
- [ ] 🟡 Samsung Internet — core features functional

### 7.3 Device Categories

- [ ] 🔴 Desktop (1920×1080) — full layout
- [ ] 🔴 Laptop (1366×768) — full layout
- [ ] 🔴 Tablet (768×1024) — responsive layout
- [ ] 🔴 Mobile (390×844, iPhone 14 size) — mobile layout
- [ ] 🟡 Low-end Android (2GB RAM) — embedding may be slower, graceful fallback

---

## 8. PWA & Offline

- [ ] 🔴 Web App Manifest present and valid
- [ ] 🔴 PWA installable on Chrome (Add to Home Screen prompt)
- [ ] 🔴 PWA installable on iOS Safari (manual Add to Home Screen)
- [ ] 🔴 Service Worker registered correctly
- [ ] 🔴 App shell loads offline (cached by SW)
- [ ] 🟡 Previously viewed documents accessible offline (cached chunks)
- [ ] 🟢 File handling API works (open PDFs directly from OS)

---

## 9. Analytics & Monitoring

- [ ] 🔴 Anonymous telemetry fires on session start
- [ ] 🔴 Question events tracked (count only, no content)
- [ ] 🔴 Feature usage events tracked (MCQ, exam, export)
- [ ] 🔴 Performance events tracked (response time, embedding speed)
- [ ] 🔴 Error events tracked (API failures, IndexedDB errors)
- [ ] 🔴 Vercel Analytics dashboard configured
- [ ] 🔴 Supabase Edge Function logs accessible
- [ ] 🟡 Weekly automated report configured
- [ ] 🟡 Critical alert thresholds set (PagerDuty / email)

---

## 10. Deployment

### 10.1 Vercel Configuration

- [ ] 🔴 Production deployment on Vercel (main branch → production)
- [ ] 🔴 Preview deployments enabled (PR → preview URL)
- [ ] 🔴 Environment variables set in Vercel dashboard (not committed to repo)
- [ ] 🔴 Custom domain configured and DNS propagated
- [ ] 🔴 HTTPS certificate valid
- [ ] 🟡 Edge runtime configured for API routes (low latency globally)

### 10.2 Supabase Configuration

- [ ] 🔴 Production Supabase project provisioned
- [ ] 🔴 All migrations applied to production DB
- [ ] 🔴 Edge Functions deployed (chat, exam, memory, keys)
- [ ] 🔴 Row Level Security enabled on all tables (device_id based)
- [ ] 🔴 Supabase Vault configured for encrypted key storage
- [ ] 🔴 Connection pooling configured (PgBouncer)
- [ ] 🟡 Supabase backups enabled (daily)
- [ ] 🟡 Read replica configured (if traffic warrants)

### 10.3 Repository & CI/CD

- [ ] 🔴 `main` branch protected (no direct pushes)
- [ ] 🔴 GitHub Actions CI runs on every PR (lint, type-check, tests)
- [ ] 🔴 No secrets committed to repository (`git log` audited)
- [ ] 🟡 Dependabot enabled for dependency updates
- [ ] 🟡 CODEOWNERS file set

---

## 11. Content & Legal

- [ ] 🔴 README.md is accurate, helpful, and up to date
- [ ] 🔴 Privacy Policy is live at `/privacy`
- [ ] 🔴 Terms of Service is live at `/terms`
- [ ] 🔴 Cookie Policy is live at `/cookies`
- [ ] 🔴 Contact / feedback email configured
- [ ] 🟡 FAQ page or help documentation linked in UI
- [ ] 🟢 Blog post / launch announcement drafted

---

## 12. Final Go/No-Go Sign-Off

### Pre-Launch Decision Matrix

| Category | Blockers Remaining | Go? |
|----------|--------------------|-----|
| Core Functionality | — | ☐ |
| Privacy & Security | — | ☐ |
| Performance | — | ☐ |
| Browser Compatibility | — | ☐ |
| Deployment | — | ☐ |
| Legal & Content | — | ☐ |
| **OVERALL** | — | ☐ |

### Sign-Off

```
Launch Decision: ☐ GO  /  ☐ NO-GO

Date: _______________
Signed off by: _______________

Blockers remaining (if NO-GO):
1. _______________
2. _______________
3. _______________

Target re-check date: _______________
```

---

## 13. Post-Launch Immediate Actions (Day 1)

- [ ] Monitor Vercel logs for errors (first 2 hours)
- [ ] Monitor Supabase Edge Function error rate
- [ ] Verify analytics events arriving correctly
- [ ] Test core flow in production (upload → embed → chat → MCQ)
- [ ] Confirm rate limiting is working (test 429 response)
- [ ] Check Lighthouse score on production URL
- [ ] Announce on relevant channels (HN, ProductHunt, Twitter/X)

---

## 14. Post-Launch Week 1 Review

- [ ] Review error logs — identify top 5 errors
- [ ] Review performance metrics vs targets
- [ ] Review user engagement telemetry (sessions, questions/session)
- [ ] Identify top UX friction points from feedback
- [ ] Prioritize hotfixes (if any)
- [ ] Publish Week 1 internal metrics report

---

**Previous**: See `18-success-metrics.md` for KPIs, monitoring dashboards, and alerting rules.  
**Start Here**: See `00-table-of-contents.md` for the full documentation index.
