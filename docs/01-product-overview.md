# DocuLearn AI — Product Overview

**Version**: 3.0 (Final)  
**Status**: Ready for Development  
**Date**: 2025

---

## 1. Vision

DocuLearn AI is a real-time adaptive learning engine embedded inside reading. 

### What It Is NOT:
- ❌ A chatbot
- ❌ A PDF reader
- ❌ A generic RAG app

### What It IS:
✅ **A thinking layer over documents**

Students read, get confused, tap, understand instantly, and explore deeper — non-linearly.

**Tagline**: *"Understand instantly. Learn without interruption."*

---

## 2. The Learning Model

```
Read → Confusion → Tap → Node Created → RAG Retrieval → AI Answer
         ↓
    Follow-up question → Child Node → Parallel Answer
         ↓
    Follow-up question → Child Node → Parallel Answer
         ↓
              (max depth = 4)
```

---

## 3. Problem Statement

| Problem | Impact |
|---------|--------|
| Students switch between reader + AI tool | Context lost, flow broken |
| Generic AI answers not grounded in document | Hallucination, confusion |
| Uploading documents to cloud AI | Privacy violation |
| Linear chat slows non-linear thinking | Poor learning efficiency |
| No revision / exam intelligence | App abandoned after reading |
| Single API key rate limits | Session broken unexpectedly |

---

## 4. Solution Summary

| Problem | DocuLearn Solution |
|---------|-------------------|
| Context switching | Viewer + AI in one tab |
| Hallucination | RAG strictly grounded in document |
| Privacy | Files parsed client-side, never uploaded |
| Linear chat | Doubt Graph (tree-based, non-linear) |
| No exam tools | Exam intelligence layer (MCQ, key terms) |
| Rate limits | Gemini key chaining + Ollama fallback |

---

## 5. Target Users

| User | Description |
|------|-------------|
| **Primary** | School and college students reading textbooks, notes, PDFs |
| **Secondary** | Self-learners and researchers with technical documents |
| **Institution** | Teachers / schools deploying AI-assisted reading at scale |

---

## 6. Core Features

### 6.1 Document Viewer
- 3-page layout (N-1, N, N+1)
- Dark mode support
- Zoom controls (50% – 200%)
- Full-text search
- Highlight-to-ask functionality

### 6.2 Doubt Graph
- Tree-based Q&A structure
- Non-linear exploration
- Max depth: 4 levels
- Max branches per node: 5
- Persistent per document session

### 6.3 RAG Pipeline
- Client-side processing (privacy-first)
- Progressive indexing (instant → partial → full)
- Hybrid retrieval (positional + semantic)
- Confidence scoring

### 6.4 Exam Intelligence
- MCQ generation
- Key concept extraction
- Page summaries
- Weak area tracking

### 6.5 AI Flexibility
- Gemini API key chaining
- Ollama local fallback
- Multiple model support
- Auto-rotation on rate limits

---

## 7. Technology Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 (App Router) | SSR + client components |
| Styling | Tailwind CSS + shadcn/ui | Dark mode, responsive |
| Database | Supabase PostgreSQL | Optional cloud sync |
| File Storage | None (client-side only) | Files never uploaded |
| Doc Parsing | pdf.js, mammoth.js, pptx2json | Client-side, in browser |
| Embedding | Transformers.js (Web Worker) | all-MiniLM-L6-v2, WASM |
| Vector Store | IndexedDB | Per-browser, per-document |
| AI Primary | Gemini 1.5 Flash / Pro | Key chaining |
| AI Fallback | Ollama (user's local URL) | Any model user has |
| PWA | next-pwa | File handlers, offline |
| Deployment | Vercel | Edge runtime for API routes |

---

## 8. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Time to first answer | < 2 seconds | Client timing, Vercel analytics |
| Page navigation speed | < 100ms | Client timing |
| Embedding throughput | > 5 chunks/sec | Worker performance events |
| Weekly user retention | > 40% | Supabase analytics |
| Questions per session | > 15 | node_graph_sync count |
| MCQ usage rate | > 30% of sessions | /api/exam/generate call rate |
| Semantic search enabled | < 30 sec for 100-page doc | Worker timing events |
| Zero document uploads | 100% | Network audit (no file POSTs) |
| Key chaining success | > 99% sessions uninterrupted | api_key_usage error_count |

---

## 9. Privacy & Security Guarantees

| Data | Stored Where | Leaves Browser? |
|------|--------------|-----------------|
| Full document content | Browser (memory only) | **NEVER** |
| Parsed page text | IndexedDB (browser) | **NO** |
| Chunk embeddings | IndexedDB (browser) | **NO** |
| Retrieved chunks (for AI) | Sent to Gemini/Ollama only | **YES (partial)** |
| Gemini API keys | Supabase (encrypted) | Server-side only |
| Chat / node history | IndexedDB (+ optional Supabase) | Optional |

---

**Next**: See `02-doubt-graph-system.md` for the core Doubt Graph architecture.
