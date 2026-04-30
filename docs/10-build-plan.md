# Build Plan — 10 Weeks

---

## PHASE 1 — Foundation (Week 1–2)

### Week 1: Project Setup

**Tasks**:
- ✅ Next.js 14 setup (App Router, TypeScript, Tailwind)
- ✅ Supabase: user_settings table for cloud sync
- ✅ User settings page: Gemini key input, Ollama URL
- ✅ API key encryption (pgcrypto) + `/api/keys/status` endpoint
- ✅ `/api/health` endpoint

**Deliverables**:
- Working Next.js app deployed to Vercel
- Settings page with encrypted key storage
- Open access — no login required

---

### Week 2: Document Viewer

**Tasks**:
- ✅ pdf.js integration → 3-page viewer layout
- ✅ URL page sync (`?page=N`), page navigation, thumbnail strip
- ✅ Zoom, dark mode, fit-to-width
- ✅ DOCX parser (mammoth.js), PPTX parser (pptx2json), TXT/MD
- ✅ Unified page model normalization

**Deliverables**:
- Multi-format document viewer
- 3-page layout with navigation
- Dark mode support

---

## PHASE 2 — RAG Core (Week 3–4)

### Week 3: Chunking & Positional RAG

**Tasks**:
- ✅ Chunking engine (all formats + special chunks)
- ✅ IndexedDB schema setup + CRUD layer
- ✅ Positional retrieval algorithm
- ✅ `/api/chat` endpoint (positional only, no streaming yet)
- ✅ Basic Q&A panel (not graph yet)

**Deliverables**:
- Working positional RAG
- Users can ask questions and get answers from current page context
- No semantic search yet

---

### Week 4: Embedding Pipeline

**Tasks**:
- ✅ Transformers.js Web Worker setup
- ✅ all-MiniLM model loading + caching
- ✅ Embedding pipeline (chunk → embed → IndexedDB)
- ✅ Priority queue incremental indexing
- ✅ Progress events → UI progress bar
- ✅ Progressive chatbot unlock state machine

**Deliverables**:
- Background embedding working
- Semantic search enabled progressively
- Progress indicator in UI

---

## PHASE 3 — Full RAG + Doubt Graph (Week 5–6)

### Week 5: Advanced RAG

**Tasks**:
- ✅ Semantic retrieval algorithm
- ✅ Hierarchical retrieval algorithm
- ✅ Dual merge + re-ranking
- ✅ Confidence scoring
- ✅ Hybrid answering modes (strict/assist/hybrid)
- ✅ `/api/chat` streaming (SSE)

**Deliverables**:
- Full RAG pipeline operational
- Streaming responses
- Confidence scores displayed

---

### Week 6: Doubt Graph

**Tasks**:
- ✅ Doubt Graph data model + IndexedDB
- ✅ Graph execution algorithm
- ✅ Graph UI (tree visualization)
- ✅ Node states (pending/streaming/done)
- ✅ Child node creation (follow-up questions)
- ✅ `/api/node/save` + `/api/node/:doc_id` endpoints

**Deliverables**:
- Working Doubt Graph UI
- Tree visualization
- Follow-up questions working
- Cloud sync optional

---

## PHASE 4 — AI Features (Week 7–8)

### Week 7: Key Management

**Tasks**:
- ✅ Gemini key chaining (KeyRotator)
- ✅ `/api/keys/rotate` endpoint
- ✅ Ollama integration + auto-fallback
- ✅ Model selector UI + model badge
- ✅ api_key_usage table + cooldown tracking

**Deliverables**:
- Automatic key rotation on rate limits
- Ollama fallback working
- No session interruptions

---

### Week 8: Exam Intelligence & Memory

**Tasks**:
- ✅ Exam intelligence layer (MCQ, key concepts, summary)
- ✅ `/api/exam/generate` endpoint
- ✅ Memory system (topic tracking, weak areas)
- ✅ `/api/memory/update` + `/api/memory/:device_id` endpoints
- ✅ Perceived speed layer implementation

**Deliverables**:
- MCQ generation working
- Weak areas tracking
- Revision suggestions

---

## PHASE 5 — Polish + Deploy (Week 9–10)

### Week 9: UX Polish

**Tasks**:
- ✅ Highlight-to-ask (text selection → ask button)
- ✅ Source chunk highlighting in viewer
- ✅ Export graph as PDF / MD
- ✅ Full-text search within document
- ✅ Error handling + fallback states for all paths

**Deliverables**:
- Polished UX
- All edge cases handled
- Export functionality

---

### Week 10: PWA & Launch

**Tasks**:
- ✅ PWA setup (next-pwa, manifest.json, service worker)
- ✅ File handler registration (.pdf, .docx, .pptx, .txt, .md)
- ✅ Offline support (app shell + model caching)
- ✅ Security audit (RLS review, key encryption audit)
- ✅ Performance audit (Lighthouse, Core Web Vitals)
- ✅ Vercel deployment + environment variables
- ✅ Final QA pass

**Deliverables**:
- Production-ready PWA
- Lighthouse score > 90
- Security audit passed
- Launch! 🚀

---

## Development Priorities

### Must-Have (V1)
- ✅ Document viewer (PDF, DOCX, PPTX, TXT, MD)
- ✅ Doubt Graph (tree-based Q&A)
- ✅ RAG pipeline (positional + semantic)
- ✅ Gemini key chaining
- ✅ Ollama fallback
- ✅ PWA with offline support

### Nice-to-Have (V1.5)
- 🔄 Multi-document library
- 🔄 Collaborative study sessions
- 🔄 Advanced analytics dashboard
- 🔄 Mobile app (Capacitor wrapper)

### Future (V2)
- 🔮 Voice input/output
- 🔮 Handwriting recognition
- 🔮 Video lecture integration
- 🔮 Spaced repetition system
- 🔮 Teacher dashboard

---

## Resource Allocation

| Phase | Duration | Team Size | Focus |
|-------|----------|-----------|-------|
| Phase 1 | 2 weeks | 2 devs | Foundation |
| Phase 2 | 2 weeks | 2 devs | RAG Core |
| Phase 3 | 2 weeks | 3 devs | Graph + Advanced RAG |
| Phase 4 | 2 weeks | 2 devs | AI Features |
| Phase 5 | 2 weeks | 3 devs | Polish + Launch |

**Total**: 10 weeks, 2-3 developers

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Embedding too slow on low-end devices | Server-side embedding fallback (`/api/embed`) |
| Gemini rate limits | Key chaining + Ollama fallback |
| Large documents crash browser | Lazy loading + pagination + Web Worker |
| IndexedDB quota exceeded | Warn user, offer to clear old documents |
| Vercel function timeout | Stream responses, use Edge runtime |

---

**Next**: See `11-algorithms.md` for all core algorithms in detail.
