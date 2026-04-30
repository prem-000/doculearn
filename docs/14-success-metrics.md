# Success Metrics & Monitoring

---

## 1. Performance Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Time to first answer | < 2 seconds | Client timing, Anonymous Telemetry |
| Page navigation speed | < 100ms | Client timing |
| Embedding throughput | > 5 chunks/sec | Worker performance events |
| Semantic search (500 chunks) | < 200ms | In-memory cosine scan timing |
| MCQ generation | < 5 seconds | Edge function latency |
| IndexedDB read (1000 chunks) | < 50ms | Indexed query timing |
| First page render | < 1 second | pdf.js lazy page load |
| Chatbot available (positional) | < 2 seconds | Synchronous N±1 extraction |
| First AI token (streaming) | < 3 seconds | Gemini streaming, perceived speed layer |

---

## 2. User Engagement Metrics (Privacy-Preserving)

*Note: All engagement metrics are collected via anonymous telemetry without PII. Document content and filenames are never tracked.*

| Metric | Target | How Measured |
|--------|--------|--------------|
| Weekly browser retention | > 40% | Anonymous local device ID telemetry |
| Questions per session | > 15 | Client-side event counting |
| MCQ usage rate | > 30% of sessions | Feature usage telemetry |
| Follow-up question rate | > 50% of root nodes | node_graph depth analysis |
| Average session duration | > 20 minutes | Client-side timing |
| Average doc size | > 3 MB | Anonymous metadata telemetry |
| Exam mode usage | > 20% of sessions | /exam page visits |
| Export usage | > 10% of sessions | Export button clicks |

---

## 3. System Health Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Zero document uploads | 100% | Network audit (no file POSTs) |
| Key chaining success | > 99% sessions uninterrupted | Client-side error telemetry |
| Semantic search enabled | < 30 sec for 100-page doc | Worker timing events |
| API error rate | < 1% | Vercel logs, Supabase Edge Function logs |
| Ollama fallback success | > 95% when triggered | Client telemetry |
| IndexedDB write success | > 99.9% | Worker error logs |
| Rate Limit Exceeded | 0 | Edge API gateway logs |

---

## 4. Quality Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Average confidence score | > 0.65 | Anonymous local score telemetry |
| High confidence rate | > 60% of answers | Local event logging |
| Low confidence rate | < 15% of answers | Local event logging |
| User satisfaction (survey) | > 4.0 / 5.0 | Optional, anonymous post-session survey |
| Answer accuracy (opt-in review)| > 90% | Voluntary user feedback loops |

---

## 5. Monitoring Dashboard

### 5.1 Real-Time Metrics (Vercel/Telemetry Analytics)

```
┌─────────────────────────────────────────┐
│ DocuLearn AI — Live Dashboard           │
├─────────────────────────────────────────┤
│ Active Sessions: 142                    │
│ Questions/min: 23                       │
│ Avg Response Time: 1.8s                 │
│ Error Rate: 0.3%                        │
│                                         │
│ API Health:                             │
│   Gemini: ● Online (3 keys active)      │
│   Ollama Fallbacks: ● 12 active         │
│   Edge Functions: ● Online              │
│                                         │
│ System Load (Anonymous):                │
│   Avg Doc Pages: 42 pages               │
│   Avg Embedding Time: 8.4s              │
│   Avg Chunk Density: 350 tokens         │
└─────────────────────────────────────────┘
```
*(Note: Document titles are completely omitted from analytics to preserve privacy.)*

### 5.2 Weekly Report (Automated)

```
DocuLearn AI — Weekly Report (Jan 8-14, 2025)

📊 Engagement Metrics (Anonymous):
- Total Unique Browsers: 1,247 (+12% vs last week)
- Active Sessions: 523 (42% retention)

📝 Usage Metrics:
- Questions Asked: 18,432 (+8%)
- Total Document Sessions: 3,456
- MCQs Generated: 2,134
- Avg Questions/Session: 17.2

⚡ Performance:
- Avg Response Time: 1.9s (target: <2s) ✅
- Embedding Speed: 6.2 chunks/sec ✅
- API Error Rate: 0.4% (target: <1%) ✅

🔑 AI Usage:
- Gemini Requests: 16,234 (88%)
- Ollama Requests: 2,198 (12%)
- Client-Side Key Rotation Events: 23
- Avg Confidence: 0.68 ✅

🐛 Issues:
- 12 Ollama connection failures (local network issues)
- 1 IndexedDB quota exceeded (large doc)
- 4 Edge function rate limit warnings

🎯 Action Items:
- Optimize embedding for low-end devices
- Add warning for documents > 200 pages
- Improve Ollama connection error messaging
```

---

## 6. Alerting Rules

### 6.1 Critical Alerts (Immediate Response)

| Condition | Alert | Action |
|-----------|-------|--------|
| Edge API error rate > 5% | PagerDuty | Investigate Vercel/Supabase logs immediately |
| Supabase DB/Edge down | PagerDuty | Check Supabase status page |
| Server-side Gemini keys exhausted | Email + Slack | Add more keys or increase limits |
| Data exfiltration attempt | Email + Slack | Security audit of API gateway |
| Response time > 10s | Email | Check Gemini API status |

### 6.2 Warning Alerts (Review Within 24h)

| Condition | Alert | Action |
|-----------|-------|--------|
| API error rate > 2% | Email | Review logs |
| Avg confidence < 0.50 | Email | Review RAG pipeline prompting |
| Browser retention < 30% | Email | Evaluate user experience / performance |
| Embedding speed < 3 chunks/sec | Email | Optimize worker for slower devices |
| IndexedDB errors > 10/day | Email | Check browser compatibility limits |

---

## 7. A/B Testing Framework

### 7.1 Experiments to Run

| Experiment | Variants | Metric | Duration |
|------------|----------|--------|----------|
| Answering mode default | Strict vs Hybrid | Confidence score, user satisfaction | 2 weeks |
| Graph visualization | Top-down vs Radial | Follow-up question rate | 2 weeks |
| Context window | N±1 vs N±2 vs N±3 | Answer quality, response time | 2 weeks |
| MCQ difficulty | Easy vs Medium vs Hard | Completion rate, user satisfaction | 2 weeks |
| Confidence badge | Show vs Hide | User trust, question rate | 2 weeks |

### 7.2 Implementation (Client-Side, Anonymous)

```javascript
// Simple A/B test framework based on anonymous local ID
function getVariant(experimentName) {
  // Retrieve or generate a persistent anonymous device ID
  let deviceId = localStorage.getItem('anonymous_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('anonymous_device_id', deviceId);
  }
  
  const hash = hashCode(deviceId + experimentName);
  return hash % 2 === 0 ? 'A' : 'B';
}

// Example usage
const variant = getVariant('answering_mode_default');
const answeringMode = variant === 'A' ? 'strict' : 'hybrid';
```

---

## 8. User Feedback Collection

### 8.1 In-App Feedback (Anonymous)

**After each answer**:
```
Was this answer helpful?
👍 Yes    👎 No    [Provide anonymous feedback]
```

**After session** (every 10 questions):
```
How would you rate your experience?
⭐⭐⭐⭐⭐

What could we improve?
[Text input]

[Submit Anonymous Feedback]
```

### 8.2 NPS Survey (Monthly Trigger)

```
How likely are you to recommend DocuLearn AI to a friend?

0  1  2  3  4  5  6  7  8  9  10
[Not at all likely]  [Extremely likely]

What's the main reason for your score?
[Text input]
```

---

## 9. Success Criteria for V1 Launch

### Must-Have (Launch Blockers)

- ✅ Time to first answer < 2 seconds (95th percentile)
- ✅ API error rate < 1%
- ✅ Zero document uploads (verified by network audit)
- ✅ Public access properly rate-limited
- ✅ API keys encrypted / handled securely
- ✅ Lighthouse score > 90
- ✅ Mobile responsive (tested on iOS + Android)
- ✅ PWA installable
- ✅ No authentication required to use core features

### Nice-to-Have (Post-Launch)

- 🔄 Weekly browser retention > 40%
- 🔄 Questions per session > 15
- 🔄 NPS score > 50
- 🔄 Avg confidence > 0.65

---

## 10. Long-Term Goals (6 Months)

| Metric | 6-Month Target |
|--------|----------------|
| Total Unique Devices | 10,000+ |
| Weekly Active Browsers | 4,000+ (40% retention) |
| Questions Asked | 500,000+ |
| Document Sessions | 50,000+ |
| NPS Score | > 60 |
| Avg Session Duration | > 30 minutes |
| Mobile Usage | > 40% of sessions |
| Exam Mode Usage | > 30% of sessions |
| Export Usage | > 15% of sessions |

---

**Next**: See `19-launch-checklist.md` for project overview and getting started guide.
