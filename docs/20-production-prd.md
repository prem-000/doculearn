# DocuLearn AI: Production-Grade PRD & System Audit

**Author**: Senior Product Engineer & UX Architect  
**Status**: Strategic Blueprint  
**Version**: 1.0  
**Date**: April 2026

---

## 1. Product Summary
**Vision**: A "thinking layer" over static documents that breaks the linear chat paradigm.  
**Problem**: Students lose context switching between readers and AI; document privacy is compromised by cloud uploads; linear AI chat doesn't match non-linear human learning.  
**Core Journey**: 
1. **Import**: Local-only parsing (privacy locked).
2. **Read**: Integrated viewer with "Doubt Graph" sidebar.
3. **Question**: Tap/Highlight → Semantic RAG → Tree-based Answer.
4. **Deep Dive**: Follow-up questions create child nodes, branching into a visual knowledge tree.

---

## 2. Current System Weaknesses (Audit Findings)

### 🔴 The "Browser Killer" PDF Engine
The current `PDFViewer.tsx` renders **every single page** of a PDF as a high-resolution canvas in a single loop upon document load. 
- **Impact**: A 100-page textbook will consume >2GB of RAM and likely crash the mobile browser or freeze the main thread for 10-15 seconds.
- **Verdict**: Critical failure for production scalability.

### 🟠 "Pseudo-Streaming" Latency
`executeAINode` fetches the *entire* AI response first and then uses `setTimeout` to "simulate" streaming words. 
- **Impact**: If Gemini takes 5 seconds to generate a long answer, the user sees nothing for 5 seconds, followed by artificial typing. True streaming (SSE) should show the first word in <500ms.
- **Verdict**: Poor UX that hides backend latency instead of solving it.

### 🟡 Main-Thread Document Parsing
`parsePDF` and `chunkText` run on the main UI thread. 
- **Impact**: The "Processing..." spinner will stutter or freeze during heavy CPU tasks (parsing 50MB PDFs), making the app feel "janky."
- **Verdict**: Violates frontend performance best practices.

### 🔴 Mobile Dead-End
The layout is currently a hardcoded horizontal split (`flex-row` implicitly handled in many views). 
- **Impact**: On a smartphone, the PDF becomes a sliver and the Doubt Graph is unusable. There is no drawer logic or mobile-specific navigation for the graph.
- **Verdict**: Not "App Ready."

---

## 3. Frontend Architecture PRD

### A. Component System Redesign: "The Windowed Viewer"
*   **Virtualization**: Replace the loop in `PDFViewer` with a **Virtual Window** (N-2 to N+2 pages). Only 5 pages should exist in the DOM at any time.
*   **Layer Separation**: 
    *   `Canvas Layer`: Low-level rendering.
    *   `Text Layer`: Transparent overlay for selection/highlighting.
    *   `Annotation Layer`: For Doubt Graph anchors.

### B. State Management: "The IndexedDB Sync Engine"
*   **Requirement**: Implement a **Zustand store** persisted via a **Web Worker** to IndexedDB.
*   **Logic**: UI updates the store → Store async-syncs to IDB → Worker handles heavy RAG/Vector searches without blocking UI.

### C. UI Consistency Rules
*   **Aesthetics**: Maintain glassmorphism for floating elements (Navbar, Modals) but use solid, high-contrast surfaces for the main reading area to reduce eye strain.
*   **Accessibility**: Minimum contrast ratio of 4.5:1 for all text. Add `aria-labels` to the node tree for screen readers.

---

## 4. UX Improvement Plan

| Feature | Current State | Production-Grade (After) |
| :--- | :--- | :--- |
| **Question Asking** | Textarea at bottom | **Contextual Popover**: Highlight text → "Ask about this" button appears. |
| **Graph Navigation** | Vertical list with lines | **Interactive Canvas**: Pinch-to-zoom, pan, and mini-map for large trees. |
| **Loading States** | Pulse animation | **Skeleton Frames**: Real-time progress bar for "Embedding..." (e.g., "54/200 pages processed"). |
| **Model Feedback** | "Error" text | **Graceful Fallback**: "Gemini limit reached. Switching to local Ollama..." (with visual indicator). |

---

## 5. Performance Optimization Plan

1.  **Web Worker Migration**: Move `@xenova/transformers` (embeddings) and `pdfjs` (parsing) into dedicated Web Workers.
2.  **Streaming SSE**: Update `api/chat/route.ts` to use `ReadableStream`. The UI should consume the stream directly.
3.  **Semantic Search v2**: Replace the keyword `includes()` search in `db.ts` with real **Cosine Similarity** over the `Float32Array` embeddings.
4.  **Asset Optimization**: Use `next/image` and lazy-load `pdfjs` only when the viewer is active.

---

## 6. PWA & Offline Readiness

To make this a "Pro" tool, it must be installable and offline-capable:
1.  **Service Worker**: Cache the `all-MiniLM-L6-v2` model (80MB) so embeddings work offline.
2.  **Protocol Handlers**: Register DocuLearn as a handler for `.pdf` files in the OS.
3.  **Offline RAG**: Enable the Doubt Graph to function entirely offline using local Ollama and IndexedDB-stored chunks.

---

## 7. Scalability & Maintainability

*   **Model Abstraction**: Create a generic `LLMProvider` interface to easily swap between Gemini, OpenAI, Anthropic, and Ollama.
*   **Error Boundaries**: Implement granular error boundaries for the PDF canvas to prevent the whole app from crashing if one page fails to render.
*   **Telemetery**: Add privacy-preserving performance monitoring (Web Vitals + RAG latency).

---

## 8. Actionable Roadmap

### Phase 1: Performance Foundation (Days 1-3)
- [ ] Move PDF parsing and Embedding to Web Workers.
- [ ] Implement **PDF Virtualization** (render only visible pages).
- [ ] Implement **Real Streaming** on `/api/chat`.

### Phase 2: UX Excellence (Days 4-6)
- [ ] Redesign `Doubt Graph` for mobile (Bottom Sheet/Drawer).
- [ ] Add **Contextual Highlighting** (ask questions directly from selected text).
- [ ] Implement **Vector-based Semantic Search** in IndexedDB.

### Phase 3: PWA & Polish (Days 7-10)
- [ ] Setup `next-pwa` and offline caching.
- [ ] Add "Exam Mode" (MCQ generation based on the Doubt Graph tree).
- [ ] Final Accessibility Audit & Dark Mode refinement.
