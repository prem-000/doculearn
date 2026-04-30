# System Architecture

---

## 1. Full System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                          BROWSER (CLIENT)                            │
│                                                                      │
│  ┌─────────────┐   ┌──────────────────┐   ┌──────────────────────┐  │
│  │ File Picker │──▶│ Document Parser  │──▶│  Chunker + Embedder  │  │
│  │ / PWA Open  │   │ pdf.js / mammoth │   │  Web Worker          │  │
│  └─────────────┘   └──────────────────┘   │  Transformers.js     │  │
│                                           └──────────┬───────────┘  │
│  ┌─────────────┐   ┌──────────────────┐              │              │
│  │  3-Page     │◀──│  React State     │   ┌──────────▼───────────┐  │
│  │  Viewer     │   │  URL: ?page=N    │   │  IndexedDB           │  │
│  └──────┬──────┘   └──────────────────┘   │  chunks + embeddings │  │
│         │                                 │  node_graph          │  │
│  ┌──────▼──────┐   ┌──────────────────┐   │  chat_history        │  │
│  │ Doubt Graph │──▶│  RAG Retriever   │◀──┘  documents           │  │
│  │ UI (Tree)   │   │  Positional +    │                          │  │
│  └─────────────┘   │  Semantic        │                          │  │
│                    └────────┬─────────┘                          │  │
└────────────────────────────┼─────────────────────────────────────┘  │
                             │                                         │
            ┌────────────────▼──────────────────────────┐             │
            │           NEXT.JS API ROUTES              │             │
            │                                           │             │
            │  POST /api/chat          (generation)     │             │
            │  POST /api/embed         (server embed)   │             │
            │  GET  /api/keys/status   (key health)     │             │
            │  POST /api/keys/rotate   (rotate key)     │             │
            │  POST /api/node/save     (cloud sync)     │             │
            │  GET  /api/node/:doc_id  (fetch graph)    │             │
            │  POST /api/exam/generate (MCQ gen)        │             │
            │  GET  /api/health        (ping)           │             │
            └──────────┬──────────────┬─────────────────┘             │
                       │              │                                │
          ┌────────────▼──┐    ┌──────▼──────┐                        │
          │  Gemini API   │    │   Ollama    │                        │
          │ (key chaining)│    │ (user local)│                        │
          └───────────────┘    └─────────────┘                        │
                                                                       │
          ┌─────────────────────────────────────┐                     │
          │  Supabase                           │                     │
          │  Auth | user_settings               │                     │
          │  api_key_usage | node_graph_sync     │                     │
          │  chat_sessions | messages           │                     │
          └─────────────────────────────────────┘                     │
```

---

## 2. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 14 (App Router) | SSR + client components |
| **Styling** | Tailwind CSS + shadcn/ui | Dark mode, responsive |
| **Database** | Supabase PostgreSQL | Optional cloud sync |
| **File Storage** | None (client-side only) | Files never uploaded |
| **Doc Parsing** | pdf.js, mammoth.js, pptx2json | Client-side, in browser |
| **Embedding** | Transformers.js (Web Worker) | all-MiniLM-L6-v2, WASM |
| **Vector Store** | IndexedDB | Per-browser, per-document |
| **AI Primary** | Gemini 1.5 Flash / Pro | Key chaining |
| **AI Fallback** | Ollama (user's local URL) | Any model user has |
| **PWA** | next-pwa | File handlers, offline |
| **Deployment** | Vercel | Edge runtime for API routes |

---

## 3. Data Flow

### 3.1 Document Upload Flow

```
1. User selects file (File Picker or PWA file handler)
2. Compute doc_id (SHA-256 hash of file)
3. Check IndexedDB: already indexed?
   - YES: Load existing chunks + embeddings → Skip to step 10
   - NO: Continue to step 4
4. Parse document (pdf.js / mammoth / pptx2json)
5. Save metadata to IndexedDB 'documents' store
6. Chunk document (sliding window, special chunks)
7. Save chunks to IndexedDB 'chunks' store
8. Start Web Worker for embedding
9. Worker embeds chunks → saves to IndexedDB 'embeddings' store
10. Update 'documents' indexing_status to 'complete'
11. Enable semantic search
```

### 3.2 Question Flow

```
1. User asks question (or clicks "Ask about this" on selected text)
2. Create node in IndexedDB 'node_graph' (status: pending)
3. Retrieve context chunks:
   - Positional: pages N-1, N, N+1
   - Semantic: top-K similar chunks (if indexing complete)
   - Merge + deduplicate
4. Build prompt (system + context + question)
5. Call /api/chat with streaming enabled
6. API route:
   - Get available Gemini key (or fallback to Ollama)
   - Call AI API with prompt
   - Stream response back to client (SSE)
7. Client receives tokens → updates node UI in real-time
8. On completion:
   - Calculate confidence score
   - Update node (status: done, answer, confidence)
   - Save to IndexedDB
   - Optional: Sync to Supabase 'node_graph_sync'
9. Update memory system (extract topic, update scores)
```

### 3.3 Follow-up Question Flow

```
1. User clicks "+" on existing node
2. Validate: depth < 4, child_count < 5
3. Create child node (parent_id = clicked node)
4. Include parent context in prompt
5. Execute same question flow as above
6. Link child node to parent in graph UI
```

---

## 4. Component Architecture

### 4.1 Frontend Components

```
app/
├── layout.tsx                 # Root layout, providers
├── page.tsx                   # Landing page
├── viewer/
│   ├── page.tsx               # Document viewer page
│   ├── components/
│   │   ├── DocumentViewer.tsx # 3-page layout
│   │   ├── PageNavigation.tsx # Thumbnails, controls
│   │   ├── DoubtGraph.tsx     # Tree visualization
│   │   ├── NodeCard.tsx       # Individual node UI
│   │   ├── AskButton.tsx      # Floating ask button
│   │   └── ConfidenceBadge.tsx
│   └── hooks/
│       ├── useDocument.ts     # Document state
│       ├── useRAG.ts          # RAG retrieval
│       └── useGraph.ts        # Graph state
├── settings/
│   └── page.tsx               # User settings
├── exam/
│   └── page.tsx               # Exam mode
└── api/
    ├── chat/route.ts          # AI generation
    ├── embed/route.ts         # Server-side embedding
    ├── keys/
    │   ├── status/route.ts
    │   └── rotate/route.ts
    ├── node/
    │   ├── save/route.ts
    │   └── [doc_id]/route.ts
    ├── exam/
    │   └── generate/route.ts
    ├── memory/
    │   ├── update/route.ts
    │   └── [user_id]/route.ts
    └── health/route.ts
```

### 4.2 Worker Architecture

```
public/
└── workers/
    ├── embed.worker.js        # Embedding pipeline
    ├── parser.worker.js       # Document parsing (optional)
    └── search.worker.js       # Semantic search (optional)
```

---

## 5. Security Architecture

### 5.1 Authentication

This application has **no login or authentication**. All API routes are publicly accessible. Users are identified by a device/session ID stored in the browser.

### 5.2 API Key Security

```
1. User enters Gemini API key in settings
2. Frontend sends key to /api/keys/add
3. Server encrypts key: pgp_sym_encrypt(key, app_secret)
4. Encrypted key stored in Supabase user_settings
5. On API call:
   - Server decrypts key: pgp_sym_decrypt(encrypted, app_secret)
   - Uses key to call Gemini API
   - Key never sent to browser
6. Cooldown tracking uses sha256(key) as identifier
```

---

## 6. Performance Optimizations

### 6.1 Client-Side

- **Lazy loading**: Only render visible pages
- **Virtual scrolling**: For large documents
- **Web Workers**: Offload embedding, parsing
- **IndexedDB batching**: Write 50 chunks at a time
- **Pre-rendering**: Render N-1, N, N+1 pages ahead
- **Debouncing**: Search input, scroll events

### 6.2 Server-Side

- **Edge runtime**: Vercel Edge for low latency
- **Streaming**: SSE for real-time responses
- **Connection pooling**: Supabase client reuse
- **Caching**: Cache API key status (60s TTL)

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────┐
│           Vercel (Production)           │
├─────────────────────────────────────────┤
│  Next.js App (Edge Runtime)             │
│  - Static pages cached at edge          │
│  - API routes on Edge Functions         │
│  - Streaming responses (SSE)            │
└─────────────┬───────────────────────────┘
              │
              ├──▶ Supabase (Database + Auth)
              │    - PostgreSQL with RLS
              │    - Real-time subscriptions (optional)
              │
              ├──▶ Gemini API (Google Cloud)
              │    - Multiple keys, chained
              │
              └──▶ Ollama (User's local machine)
                   - Optional fallback
```

---

## 8. Scalability Considerations

### 8.1 Current Limits (V1)

- **Document size**: Up to 500 pages (tested)
- **Concurrent users**: Limited by Vercel plan
- **IndexedDB**: ~50MB per document (browser limit: ~1GB)
- **Gemini API**: Rate limits per key (60 req/min)

### 8.2 Future Scaling (V2+)

- **Server-side vector DB**: Pinecone, Weaviate for large docs
- **Distributed embedding**: Queue system (BullMQ + Redis)
- **CDN caching**: Cache model weights at edge
- **Multi-region**: Deploy to multiple Vercel regions

---

**Next**: See `13-privacy-security.md` for detailed security specifications.
