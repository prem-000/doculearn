# 📖 DocuLearn AI

### Spatial AI Learning System for Documents

DocuLearn AI is a next-generation AI-powered document learning platform that transforms PDFs, DOCX files, PPTs, and notes into an interactive learning workspace.

Unlike traditional document readers or chatbots, DocuLearn introduces:
* 📌 Spatial AI Anchors
* 🌳 Tree-based doubt exploration
* ⚡ Progressive RAG retrieval
* 🧠 Context-aware AI assistance
* 📱 Mobile-first AI interaction system

---

# 🚀 Core Concept

Instead of:
`PDF + chatbot`

DocuLearn creates:
`Interactive document + contextual AI anchors + branching learning graph`

Users can:
* tap anywhere in a document
* create AI discussions
* branch follow-up questions
* explore concepts visually
* continue reading without interruption

---

# 🔥 Key Innovation — Spatial AI Anchors

Every AI interaction is attached directly to a location inside the document.

Example:
```text
Page 4
 ├── AI Anchor #1 → "Explain recursion"
 │      ├── Follow-up → "Why stack memory?"
 │      ├── Follow-up → "Time complexity?"
 │
 ├── AI Anchor #2 → "Generate MCQs"
```

This creates:
> A live knowledge graph embedded inside reading.

---

# 🌳 Doubt Graph System

Traditional AI chat is linear.

DocuLearn uses:
* root nodes
* child branches
* parallel question processing

Each doubt becomes a structured learning path.

---

## Example

```text
Root:
"What is Dynamic Programming?"

 ├── "What is memoization?"
 ├── "Difference from recursion?"
 │      ├── "Space complexity?"
 │
 ├── "Python example?"
```

---

# 📱 Mobile-First Architecture

## ❌ Traditional Problem
Most AI readers fail on mobile because:
* PDF and chatbot compete for space
* keyboard destroys layout
* reading flow breaks

---

# ✅ DocuLearn Mobile Solution

## Layer-Based Interaction System
```text
Layer 1 → Document Viewer
Layer 2 → Selection Overlay
Layer 3 → AI Anchor Pins
Layer 4 → Bottom Sheet AI Thread
Layer 5 → Fullscreen Discussion
```

---

## AI Interaction Flow

### Reading Mode
* clean distraction-free document view

### Long Press / Tap
* create AI anchor
* select text or region

### Context Actions
```text
[Explain]
[Simplify]
[Generate MCQ]
[Summarize]
[Ask Follow-up]
```

### AI Bottom Sheet
* opens contextual thread
* expandable
* collapsible
* mobile optimized

---

# ⚡ Progressive RAG Engine

DocuLearn uses a multi-stage retrieval system optimized for speed and low latency.

---

## Phase 1 — Instant Retrieval
Uses:
* current page
* nearby pages (N-1, N, N+1)
Response available immediately.

---

## Phase 2 — Nearby Semantic Search
Indexes:
* nearby sections
* important chunks
Enables semantic understanding progressively.

---

## Phase 3 — Full Document Semantic Graph
Background indexing:
* entire document
* formulas
* figures
* semantic relationships

---

# 🧠 Retrieval Architecture

## Hybrid Retrieval System

### Positional Retrieval
Fast contextual lookup:
`current page ± nearby pages`

### Semantic Retrieval
Cosine similarity over embeddings:
`question_embedding ↔ chunk_embeddings`

### Hierarchical Filtering
```text
Document
 → Sections
 → Nearby pages
 → Ranked chunks
```

---

# 📌 Spatial AI System

## AI Anchor Model
```json
{
  "anchor_id": "uuid",
  "page": 4,
  "x": 420,
  "y": 810,
  "selected_text": "...",
  "question": "...",
  "answer": "...",
  "parent_id": null,
  "children": [],
  "type": "explain"
}
```

---

# ⚙️ Tech Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Frontend       | Next.js 14               |
| Styling        | Tailwind CSS + shadcn/ui |
| Database       | Supabase                 |
| Authentication | Supabase Auth            |
| PDF Parsing    | pdf.js                   |
| DOCX Parsing   | mammoth.js               |
| PPT Parsing    | pptx2json                |
| Embeddings     | Transformers.js          |
| Vector Store   | IndexedDB                |
| AI Models      | Gemini API               |
| Offline AI     | Ollama                   |
| Mobile Support | PWA + APK wrapper        |

---

# 🔥 Features

## 📄 Smart Document Viewer
* PDF / DOCX / PPT support
* Smooth page navigation
* Full-text search
* Dark mode

---

## 📌 AI Anchor System
* Place AI discussions anywhere
* Spatial contextual learning
* Expandable anchor threads

---

## 🌳 Doubt Graph
* Non-linear learning
* Follow-up branching
* Parallel AI processing

---

## 🎯 Exam Intelligence
* Generate MCQs
* Important topic detection
* Quick revision mode

---

## 🧠 Memory System
Tracks:
* repeated doubts
* weak concepts
* revision frequency

---

## 🔐 Privacy-First Design
* documents stay local
* client-side embeddings
* only retrieved chunks sent to AI

---

# ⚡ Performance Optimizations
* Progressive indexing
* Web Worker embeddings
* Streaming AI responses
* Selective embedding strategy
* Lazy semantic retrieval

---

# 📊 Core Algorithms

## 1. Incremental Indexing
```text
Priority:
1. current page
2. nearby pages
3. rest of document
```

---

## 2. Confidence Scoring
```text
confidence =
(similarity × 0.6) +
(context coverage × 0.4)
```

---

## 3. Node Graph Traversal
* DFS → branch exploration
* BFS → summary generation

---

## 4. Spatial Clustering
Nearby AI anchors:
`+4 discussions`
preventing UI clutter.

---

# 📱 Mobile UX Design Principles
* PDF remains primary focus
* AI appears contextually
* No permanent chat panel
* Bottom-sheet interactions
* Minimal overlay obstruction

---

# 🚀 Product Positioning

DocuLearn AI is NOT:
* a PDF reader
* a chatbot
* a generic RAG wrapper

It is:
> A spatial AI learning workspace embedded directly into documents.

---

# 🗓️ Build Roadmap

## Phase 1
* Viewer
* Positional AI retrieval
* Basic anchors

---

## Phase 2
* Doubt graph
* Progressive RAG
* Streaming AI

---

## Phase 3
* Semantic graph
* Exam intelligence
* Memory system

---

## Phase 4
* Offline AI
* Collaboration
* Learning analytics

---

# 🎯 Target Users
* Engineering students
* Competitive exam aspirants
* Researchers
* Knowledge workers
* Teachers

---

# 🔐 Privacy & Security
* Files never fully uploaded
* Encrypted API key storage
* Local vector database
* Row Level Security (RLS)
* HTTPS enforced

---

# 🏁 Tagline
### “Turn documents into interactive knowledge spaces.”
