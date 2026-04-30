# Security Audit Checklist

This comprehensive checklist should be completed before launch and reviewed quarterly.

---

## 1. No Authentication Required

This application has **no login system**. The following traditional auth checks are **not applicable**:
- JWT validation
- OAuth configuration
- Session management
- Password reset flows


### Row Level Security (RLS)

Since there is no user authentication, RLS policies based on `auth.uid()` are not used. All data is keyed by device/session ID.

---

## 2. Data Encryption

### API Key Encryption

- [ ] Gemini API keys encrypted with pgcrypto
- [ ] Encryption secret stored securely (not in code)
- [ ] Encryption secret backed up securely
- [ ] Decryption only happens server-side
- [ ] Plaintext keys never sent to browser
- [ ] Key hashes (SHA-256) used for identification
- [ ] Encryption/decryption functions tested

### Data in Transit

- [ ] All connections use HTTPS (TLS 1.3)
- [ ] HTTP automatically redirects to HTTPS
- [ ] HSTS header configured (max-age=31536000)
- [ ] Certificate valid and not expiring soon
- [ ] No mixed content warnings
- [ ] WebSocket connections use WSS (if applicable)

### Data at Rest

- [ ] Supabase database encrypted at rest (default)
- [ ] Vercel environment variables encrypted (default)
- [ ] No sensitive data in logs
- [ ] No sensitive data in error messages
- [ ] IndexedDB data stays local (never synced unencrypted)

---

## 3. Input Validation & Sanitization

### API Route Validation

- [ ] All API routes use Zod schemas for validation
- [ ] String inputs have max length limits
- [ ] Numeric inputs have min/max bounds
- [ ] Enum inputs validated against allowed values
- [ ] UUID inputs validated as proper UUIDs
- [ ] Email inputs validated as proper emails
- [ ] URL inputs validated as proper URLs
- [ ] File upload validation (if applicable)
- [ ] Validation errors return 400 status with details

### SQL Injection Prevention

- [ ] All database queries use parameterized queries
- [ ] No string concatenation in SQL queries
- [ ] Supabase client methods used (not raw SQL)
- [ ] RPC functions use parameters (not string interpolation)
- [ ] User input never directly inserted into SQL
- [ ] SQL injection tests passed

### XSS Prevention

- [ ] React automatic escaping used for all user content
- [ ] `dangerouslySetInnerHTML` avoided (or sanitized with DOMPurify)
- [ ] User-generated HTML sanitized before rendering
- [ ] CSP headers configured to prevent inline scripts
- [ ] No `eval()` or `Function()` constructor used
- [ ] XSS tests passed

### CSRF Prevention

- [ ] State parameter validated in OAuth flow (N/A — no OAuth)
- [ ] SameSite cookie policy set (N/A — no auth cookies)
- [ ] CSRF tests not applicable (no form-based auth)

---

## 4. Security Headers

### Headers Configuration

- [ ] Content-Security-Policy header configured
- [ ] X-Frame-Options: DENY set
- [ ] X-Content-Type-Options: nosniff set
- [ ] Referrer-Policy: strict-origin-when-cross-origin set
- [ ] Permissions-Policy configured (camera, microphone, geolocation disabled)
- [ ] Strict-Transport-Security header set (HSTS)
- [ ] Headers verified at securityheaders.com (A+ rating)

### CSP Directives

- [ ] `default-src 'self'` set
- [ ] `script-src` allows only necessary sources
- [ ] `style-src` allows only necessary sources
- [ ] `img-src` allows data: and blob: for local images
- [ ] `connect-src` allows only API endpoints
- [ ] `worker-src` allows blob: for Web Workers
- [ ] `frame-src` allows only OAuth providers
- [ ] `object-src 'none'` set
- [ ] `base-uri 'self'` set
- [ ] `form-action 'self'` set
- [ ] `frame-ancestors 'none'` set
- [ ] `upgrade-insecure-requests` set

---

## 5. Rate Limiting

### API Route Rate Limits

- [ ] Rate limiting implemented on `/api/chat` (30 req/min)
- [ ] Rate limiting implemented on `/api/embed` (60 req/min)
- [ ] Rate limiting implemented on `/api/exam/generate` (10 req/min)
- [ ] Rate limiting implemented on `/api/node/save` (100 req/min)
- [ ] Rate limit errors return 429 status
- [ ] Retry-After header included in 429 responses
- [ ] Rate limits tested under load

### Gemini API Rate Limiting

- [ ] Key rotation algorithm implemented
- [ ] Cooldown tracking working correctly
- [ ] Automatic fallback to next key on 429
- [ ] Ollama fallback working when all keys exhausted
- [ ] Rate limit status visible to users
- [ ] Key usage statistics tracked

---

## 6. Session Management

This application has **no login system** and therefore no session cookies or JWTs to manage. Users are identified by a device ID stored in `localStorage`.

- [ ] Device ID generated and persisted in localStorage
- [ ] Device ID used for rate limiting (per-device)
- [ ] No sensitive data in localStorage beyond device ID

---

## 7. Privacy & Data Protection

### Data Minimization

- [ ] No user accounts, emails, or passwords collected
- [ ] No unnecessary tracking or analytics
- [ ] Documents never uploaded to server
- [ ] Only text chunks sent to AI (not full documents)
- [ ] No PII collected without consent
- [ ] Data retention policies documented

### User Consent

- [ ] Cloud sync opt-in (default: off)
- [ ] Analytics opt-in (default: off)
- [ ] Consent recorded in database
- [ ] Consent can be withdrawn anytime
- [ ] Data deleted when consent withdrawn

### GDPR Compliance

- [ ] Privacy Policy published and accessible
- [ ] Cookie Policy published (if applicable)
- [ ] Terms of Service published
- [ ] Data export functionality working
- [ ] Cloud data deletion functionality working
- [ ] Data portability (CSV/JSON) working
- [ ] User rights requests handled within 30 days
- [ ] Data breach notification procedure documented
- [ ] DPO contact information provided (if required)

---

## 8. Dependency Security

### Dependency Auditing

- [ ] `npm audit` passing (no high/critical vulnerabilities)
- [ ] Dependabot configured and active
- [ ] Dependencies updated regularly
- [ ] No known vulnerable packages
- [ ] Lockfile (package-lock.json) committed
- [ ] No unused dependencies

### Third-Party Services

- [ ] Supabase security best practices followed
- [ ] Vercel security best practices followed
- [ ] Google Gemini API terms complied with
- [ ] Third-party service SLAs reviewed
- [ ] Data processing agreements signed (if required)

---

## 9. Logging & Monitoring

### Security Logging

- [ ] Failed authentication attempts logged (N/A — no login)
- [ ] Rate limit violations logged
- [ ] Invalid input attempts logged
- [ ] API key rotation events logged
- [ ] Data deletion events logged
- [ ] Unusual activity patterns logged
- [ ] Logs stored securely (RLS enabled)
- [ ] Logs retained for appropriate duration (1 year)

### Monitoring & Alerts

- [ ] Failed auth attempts monitored (N/A — no login)
- [ ] Rate limit violations monitored
- [ ] API error rates monitored
- [ ] Database connection errors monitored
- [ ] Uptime monitoring configured (99.9% target)
- [ ] Alert notifications configured (email/Slack)

### Incident Response

- [ ] Incident response plan documented
- [ ] Security contact email published (security@doculearn.app)
- [ ] Data breach notification procedure ready
- [ ] API key revocation procedure tested
- [ ] Device blocking procedure documented
- [ ] Incident response team identified

---

## 10. Code Security

### Secure Coding Practices

- [ ] No secrets in source code
- [ ] No secrets in git history
- [ ] Environment variables used for secrets
- [ ] `.env.local` in `.gitignore`
- [ ] No commented-out sensitive code
- [ ] Error messages don't leak sensitive info
- [ ] Stack traces hidden in production
- [ ] Debug mode disabled in production

### Code Review

- [ ] Security-focused code review completed
- [ ] All API routes reviewed for auth checks
- [ ] All database queries reviewed for SQL injection
- [ ] All user inputs reviewed for validation
- [ ] All third-party integrations reviewed
- [ ] Penetration testing completed (optional but recommended)

---

## 11. Infrastructure Security

### Vercel Configuration

- [ ] Environment variables configured correctly
- [ ] Production environment separated from preview
- [ ] Deployment protection enabled
- [ ] Custom domain HTTPS configured
- [ ] Edge runtime used for API routes (if applicable)
- [ ] Function timeout configured appropriately
- [ ] No sensitive data in build logs

### Supabase Configuration

- [ ] Database connection pooling enabled
- [ ] Database backups configured (automatic)
- [ ] Point-in-time recovery enabled
- [ ] IP allowlist configured (if applicable)
- [ ] Service role key secured (not exposed)
- [ ] Anon key rate limits configured
- [ ] Database extensions reviewed for security

---

## 12. Client-Side Security

### Browser Security

- [ ] Documents processed locally (never uploaded)
- [ ] IndexedDB data stays local
- [ ] Web Workers sandboxed properly
- [ ] No sensitive data in localStorage
- [ ] No sensitive data in sessionStorage
- [ ] Browser console warnings addressed
- [ ] No mixed content warnings

### PWA Security

- [ ] Service worker HTTPS-only
- [ ] Service worker scope limited
- [ ] Cached data encrypted (if sensitive)
- [ ] Offline functionality secure
- [ ] File handler permissions appropriate

---

## 13. Testing

### Security Testing

- [ ] SQL injection tests passed
- [ ] XSS tests passed
- [ ] Rate limiting tests passed
- [ ] Input validation tests passed

### Penetration Testing (Optional)

- [ ] External penetration test completed
- [ ] Vulnerabilities identified and fixed
- [ ] Retest completed after fixes
- [ ] Penetration test report reviewed

---

## 14. Documentation

### Security Documentation

- [ ] Security architecture documented
- [ ] Threat model documented
- [ ] Security measures documented
- [ ] Incident response plan documented
- [ ] Data flow diagrams created
- [ ] Privacy policy accurate and complete
- [ ] Terms of service accurate and complete

### Developer Documentation

- [ ] Security best practices documented
- [ ] Secure coding guidelines documented
- [ ] Deployment security checklist created
- [ ] Onboarding security training materials ready

---

## 15. Pre-Launch Final Checks

### Critical Pre-Launch Items

- [ ] All items in this checklist completed
- [ ] Security review by external expert (recommended)
- [ ] Legal review of privacy policy and terms
- [ ] Data breach insurance obtained (optional)
- [ ] Security contact email monitored
- [ ] Incident response team on standby
- [ ] Backup and recovery tested
- [ ] Rollback procedure documented and tested

### Launch Day Checklist

- [ ] Monitor logs for unusual activity
- [ ] Monitor error rates
- [ ] Monitor authentication failures
- [ ] Monitor rate limit violations
- [ ] Have incident response team available
- [ ] Have rollback plan ready

---

## 16. Post-Launch Ongoing Security

### Weekly Tasks

- [ ] Review security logs for anomalies
- [ ] Check Dependabot alerts
- [ ] Monitor rate limit violations
- [ ] Check uptime and error rates

### Monthly Tasks

- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review and update dependencies
- [ ] Test incident response procedures
- [ ] Review access logs for unusual patterns
- [ ] Verify backup integrity
- [ ] Review user consent records

### Quarterly Tasks

- [ ] Security headers audit (securityheaders.com)
- [ ] Penetration testing (if budget allows)
- [ ] Review and update security policies
- [ ] Team security training
- [ ] Disaster recovery drill
- [ ] Privacy policy review
- [ ] Terms of service review
- [ ] Third-party service audit

### Annual Tasks

- [ ] Comprehensive security audit
- [ ] External penetration testing
- [ ] Legal compliance review
- [ ] Data retention policy review
- [ ] Incident response plan update
- [ ] Security insurance renewal (if applicable)
- [ ] Staff security training refresh

---

## Audit Sign-Off

### Pre-Launch Audit

- **Auditor Name**: ___________________________
- **Date**: ___________________________
- **Signature**: ___________________________
- **Status**: ☐ Approved for Launch  ☐ Requires Fixes

### Quarterly Audit

- **Q1 Audit Date**: ___________________________
- **Q2 Audit Date**: ___________________________
- **Q3 Audit Date**: ___________________________
- **Q4 Audit Date**: ___________________________

---

**Note**: This checklist should be reviewed and updated as new security threats emerge and best practices evolve.
