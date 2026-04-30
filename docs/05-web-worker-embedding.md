# Web Worker Embedding Pipeline

---

## 1. Architecture

```
MAIN THREAD                          EMBED WORKER (embed.worker.js)
───────────                          ──────────────────────────────
File opened
  → parse pages (pdf.js)
  → postMessage(pages[])  ─────────▶ Receive pages
                                     INIT (once per session):
                                      Load Transformers.js WASM (~5MB, cached)
                                      Load all-MiniLM-L6-v2 (~23MB, cached)
                                      postMessage({type:'model_ready'})

  Receive 'model_ready'
  → Enable positional chatbot       ▶ Chunk all pages
  → Show progress bar                 Apply priority scoring
                                      Embed: text → tokenize → ONNX → Float32Array
                                      Batch write to IndexedDB (50 chunks/batch)
                                      postMessage({type:'progress', done:N, total:M})

  Update progress bar (N/M) ◀─────── Progress events
  Show "Indexing... 45%" ◀───────────

  Receive 'indexing_complete'   ◀─── postMessage({type:'indexing_complete'})
  → Enable semantic search
  → Show "Ready" badge
```

---

## 2. Progressive Chatbot Unlock

### STATE MACHINE:

```
file_opened
  ↓ (synchronous, <2 sec)
positional_ready
  → chatbot ENABLED (positional context only)
  → user can start asking immediately
  ↓ (background worker, 2–30 sec depending on doc size)
partial_semantic_ready
  → semantic search enabled for ±10 pages
  ↓ (background worker, 10 sec – several min)
full_index_ready
  → semantic search enabled for entire document
  → "Ready" badge shown
```

---

## 3. Model Details

| Property | Value |
|----------|-------|
| **Model** | all-MiniLM-L6-v2 |
| **Source** | Hugging Face via Transformers.js |
| **Runtime** | ONNX (WebAssembly, runs in browser) |
| **Output** | 384-dimensional Float32Array |
| **Size** | ~23MB (cached after first load) |
| **Speed** | 5–20 chunks/second depending on device |
| **Storage** | Cache API + OPFS for model weights |

---

## 4. Performance Estimates

| Device | Chunks/sec | 50-page PDF | 200-page PDF |
|--------|------------|-------------|--------------|
| Modern laptop (M2 / i7) | ~20/sec | ~10 sec | ~40 sec |
| Mid-range laptop | ~10/sec | ~20 sec | ~80 sec |
| Low-end / old laptop | ~5/sec | ~40 sec | ~160 sec |
| Mid-range phone | ~3/sec | ~60 sec | ~240 sec |

**Note**: Chatbot works immediately (positional). These times are for full semantic indexing.

---

## 5. IndexedDB Write Strategy

| Property | Value |
|----------|-------|
| **Batch size** | 50 chunks per IndexedDB transaction |
| **Reason** | Avoid UI jank from too-frequent writes |
| **Error handling** | If write fails → retry 3× → mark chunk unindexed |
| **Cleanup** | On new file open → check doc_id → skip if already indexed |

---

## 6. Incremental Indexing Priority Queue

```
ALGORITHM: IncrementalIndexPriority

Priority Queue (max-heap by priority_score):

for each page in document:
  if page == current_page:                   priority = 100
  elif abs(page - current_page) <= 3:        priority = 80
  elif page contains heading:                priority = 60
  elif abs(page - current_page) <= 10:       priority = 40
  else:                                      priority = 10

Worker processes pages in priority order:
  high-priority pages indexed first
  → semantic search unlocks progressively, best-first
```

---

## 7. Worker Message Protocol

### From Main Thread to Worker

```javascript
// Initialize worker
{ type: 'init', pages: [...] }

// Request embedding
{ type: 'embed', chunks: [...] }

// Cancel current operation
{ type: 'cancel' }
```

### From Worker to Main Thread

```javascript
// Model loaded and ready
{ type: 'model_ready' }

// Progress update
{ type: 'progress', done: 45, total: 200 }

// Embedding complete
{ type: 'embedding_complete', chunk_id: '...', embedding: Float32Array }

// All indexing complete
{ type: 'indexing_complete', total_chunks: 200 }

// Error occurred
{ type: 'error', message: '...' }
```

---

## 8. Caching Strategy

### Model Weights
- Stored in **Cache API** (persistent across sessions)
- Key: `transformers-cache-v1`
- Size: ~28MB total (WASM + model)
- Cleared only on manual cache clear

### Embeddings
- Stored in **IndexedDB** `embeddings` store
- Keyed by `chunk_id`
- Persistent per document
- Cleared when document is deleted

---

## 9. Perceived Speed Optimization

### Timeline of User Experience

```
t=0ms    → File opened
t=50ms   → First page rendered
t=200ms  → Positional chatbot enabled (user can ask questions)
t=2s     → Partial semantic enabled (±10 pages)
t=10s+   → Full semantic enabled (entire document)
```

**Key Insight**: User never waits. Chatbot is available in 200ms with positional context, then progressively improves.

---

**Next**: See `06-api-endpoints.md` for complete API specifications.
