# Launch Checklist — Final Production Readiness

---

## 1. Vercel Configuration (Production)

### Environment Variables
- [ ] `SUPABASE_URL` (Production URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Secret)
- [ ] `GEMINI_ENCRYPTION_SECRET` (Random 32-char string)
- [ ] `NEXT_PUBLIC_APP_URL` (https://doculearn.app)
- [ ] `NEXT_PUBLIC_GA_ID` (Anonymous Google Analytics, optional)

### Deployment Settings
- [ ] Domain `doculearn.app` connected and SSL active
- [ ] Preview deployments enabled for all branches
- [ ] Function Region set to closest to target users (e.g., `sin1` or `iad1`)
- [ ] Edge runtime enabled for `/api/chat` and `/api/embed`

---

## 2. Supabase Configuration (Production)

### Database Setup
- [ ] All migrations applied to production (`supabase db push`)
- [ ] Edge functions deployed (`supabase functions deploy`)
- [ ] PostgREST enabled and key rotation logic tested in prod
- [ ] Daily backups scheduled

### Security & Access
- [ ] Row Level Security (RLS) policies strict (Device ID verified)
- [ ] Anonymous access allowed for specific Edge Functions
- [ ] Service role key never used in client-side code
- [ ] Database password stored in secure vault

---

## 3. PWA & Frontend Validation

### PWA Readiness
- [ ] `manifest.json` icons generated (192x192, 512x512)
- [ ] Service worker correctly caching app shell
- [ ] Offline fallback page working
- [ ] Installation prompt appearing on mobile/desktop
- [ ] File handler associations verified (.pdf opens app)

### Performance (Lighthouse Targets)
- [ ] **Performance**: > 90
- [ ] **Accessibility**: > 95
- [ ] **Best Practices**: > 100
- [ ] **SEO**: > 100
- [ ] **PWA**: All checks passing

---

## 4. AI & RAG Pipeline Audit

### Key Management
- [ ] Minimum 3 Gemini API keys in the `api_keys` pool
- [ ] Key rotation algorithm verified in production environment
- [ ] Ollama fallback tested with local instance
- [ ] Rate limits configured (30 RPM for Chat, 60 RPM for Embed)

### Retrieval Accuracy
- [ ] Positional retrieval verified for multi-page PDF
- [ ] Semantic search working with local IndexedDB vector store
- [ ] Confidence scoring logic producing expected labels (High/Med/Low)
- [ ] Source chunk highlighting correctly mapping to PDF page numbers

---

## 5. Privacy & Legal Compliance

### Compliance
- [ ] Privacy Policy linked in footer and settings
- [ ] Terms of Service link active
- [ ] "Zero Document Upload" claim verified via network tab audit
- [ ] Data export (JSON/PDF) functionality working correctly
- [ ] Local storage "Clear All Data" button verified

### Documentation
- [ ] README updated with production URLs
- [ ] User guide / FAQ populated
- [ ] Support email `hello@doculearn.app` active

---

## 6. Pre-Launch Stress Tests

### Load Testing
- [ ] 50 concurrent users asking questions (Vercel Edge test)
- [ ] Document processing test (500-page PDF stress test)
- [ ] Network failure simulation (Verify offline retry logic)
- [ ] Local storage quota overflow test

### Error Handling Pass
- [ ] 404 page custom branded
- [ ] API error states show user-friendly messages (no raw stack traces)
- [ ] Retrieval failure → "No context found" fallback
- [ ] LLM timeout → Automatic retry or fallback trigger

---

## 7. Go-Live Steps (Launch Day)

1. [ ] Final build check (`npm run build`)
2. [ ] Purge Vercel cache
3. [ ] Run final E2E test suite (Playwright)
4. [ ] Monitor Vercel logs for early 500s
5. [ ] Announce on Product Hunt / Twitter 🚀

---

**Next**: See `01-product-overview.md` to restart the documentation journey.
