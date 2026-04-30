# Core Algorithms — Complete Reference

---

## 1. Cosine Similarity

```javascript
function cosineSimilarity(vecA, vecB) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot   += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Purpose**: Measure similarity between question embedding and chunk embeddings.

**Input**: Two Float32Array vectors (384-dim)

**Output**: Float (0.0 – 1.0), where 1.0 = identical

---

## 2. Token Counter (Approximate)

```javascript
function countTokens(text) {
  // Approximation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}
```

**Purpose**: Estimate token count for budget management.

**Note**: This is an approximation. For exact counts, use a tokenizer library.

---

## 3. Document Hash (doc_id)

```javascript
async function computeDocId(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
```

**Purpose**: Generate unique, deterministic ID for each document.

**Input**: File object

**Output**: 32-character hex string (SHA-256 hash)

---

## 4. MCQ Generation Algorithm

```
ALGORITHM: MCQGeneration

INPUT: chunks[], count=5

for each target_chunk in top_chunks[:count]:

  STEP 1 — Extract key term
    key_terms = extract_noun_phrases(chunk.text)
    target_term = key_terms[0]

  STEP 2 — Generate question
    prompt = f"Generate a multiple choice question testing understanding of: {target_term}
              based on this passage: {chunk.text}
              Format: Question + 4 options (A,B,C,D) + correct answer + explanation"

  STEP 3 — Generate distractors
    similar_terms = semantic_search(target_term, all_chunks, k=3)
    distractors = [term.text for term in similar_terms if term != target_term]

  STEP 4 — Validate
    ensure correct answer is unambiguous
    ensure distractors are plausible but clearly wrong

OUTPUT: MCQ[] with question, options, answer, explanation, source_chunk_id
```

---

## 5. Memory Scoring Algorithm

```
ALGORITHM: MemoryScore

INPUT: topic, question_history[]

frequency = count(questions about topic in history)
recency   = 1 / (days_since_last_question + 1)
avg_confidence = average(confidence_scores for topic questions)

topic_score = (frequency × 0.4) + (recency × 0.3) + ((1 - avg_confidence) × 0.3)

if topic_score > 0.6: mark as "weak area", suggest revision
if topic_score < 0.3: mark as "strong area"
```

**Purpose**: Identify topics the student struggles with.

**Factors**:
- **Frequency** (40%): How often they ask about this topic
- **Recency** (30%): How recently they asked
- **Low confidence** (30%): How uncertain the answers were

---

## 6. Perceived Speed Algorithm

```
ALGORITHM: PerceivedSpeed

When user submits question:

  t=0ms   → Show "Thinking..." spinner
  t=0ms   → Begin positional retrieval (sync, <50ms)
  t=50ms  → Show "Found context in pages N-1, N, N+1"
  t=200ms → Begin AI stream request
  t=800ms → First token arrives → swap spinner for streaming text
  t=Xms   → Streaming complete → show confidence badge + model badge
```

**Purpose**: Make the system feel fast even when AI takes time.

**Key**: Show progress at every step, never leave user waiting in silence.

---

## 7. Incremental Indexing Priority Queue

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

**Purpose**: Index the most relevant pages first so semantic search becomes useful quickly.

---

## 8. Chunk Deduplication

```javascript
function deduplicateChunks(chunks) {
  const seen = new Set();
  const unique = [];
  
  for (const chunk of chunks) {
    if (!seen.has(chunk.chunk_id)) {
      unique.push(chunk);
      seen.add(chunk.chunk_id);
    }
  }
  
  return unique;
}
```

**Purpose**: Remove duplicate chunks when merging positional + semantic results.

---

## 9. Sliding Window Chunking

```javascript
function slidingWindowChunk(paragraphs, maxTokens = 512, overlap = 80) {
  const chunks = [];
  let currentChunk = [];
  let currentTokens = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const paraTokens = countTokens(para);
    
    if (currentTokens + paraTokens > maxTokens && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        text: currentChunk.join('\n\n'),
        token_count: currentTokens
      });
      
      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-1).join('\n\n'); // Last paragraph
      currentChunk = [overlapText, para];
      currentTokens = countTokens(overlapText) + paraTokens;
    } else {
      currentChunk.push(para);
      currentTokens += paraTokens;
    }
  }
  
  // Save final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join('\n\n'),
      token_count: currentTokens
    });
  }
  
  return chunks;
}
```

**Purpose**: Split text into overlapping chunks to prevent context loss at boundaries.

---

## 10. Heading Extraction

```javascript
function extractHeadings(page) {
  const headings = [];
  
  // PDF: Look for larger font sizes
  for (const item of page.items) {
    if (item.height > 14) { // Heuristic: headings are larger
      headings.push({
        text: item.str,
        level: item.height > 18 ? 1 : 2,
        position: item.transform[5] // Y position
      });
    }
  }
  
  // DOCX/HTML: Use heading tags
  const htmlHeadings = page.html.match(/<h([1-6])>(.*?)<\/h\1>/gi);
  if (htmlHeadings) {
    for (const match of htmlHeadings) {
      const level = parseInt(match.match(/<h([1-6])>/)[1]);
      const text = match.replace(/<\/?h[1-6]>/g, '');
      headings.push({ text, level });
    }
  }
  
  return headings;
}
```

**Purpose**: Extract document structure for hierarchical retrieval.

---

## 11. Math Detection

```javascript
function detectMath(text) {
  // LaTeX patterns
  const latexPatterns = [
    /\$\$.*?\$\$/g,           // Display math
    /\$.*?\$/g,              // Inline math
    /\\begin\{equation\}/,   // Equation environment
    /\\frac\{/,              // Fractions
    /\\sum_/,                // Summations
    /\\int_/                 // Integrals
  ];
  
  for (const pattern of latexPatterns) {
    if (pattern.test(text)) return true;
  }
  
  // Equation density heuristic
  const mathSymbols = text.match(/[∫∑∏√±×÷≈≠≤≥∞]/g);
  const equationDensity = mathSymbols ? mathSymbols.length / text.length : 0;
  
  return equationDensity > 0.05; // 5% threshold
}
```

**Purpose**: Identify math-heavy chunks for special handling.

---

## 12. Table Extraction

```javascript
function extractTables(page) {
  const tables = [];
  
  // Heuristic: Look for grid-like text patterns
  const lines = page.text.split('\n');
  let currentTable = [];
  let inTable = false;
  
  for (const line of lines) {
    const cellCount = line.split(/\s{2,}|\t/).length;
    
    if (cellCount >= 3) { // Likely a table row
      if (!inTable) {
        inTable = true;
        currentTable = [];
      }
      currentTable.push(line);
    } else if (inTable && currentTable.length > 2) {
      // End of table
      tables.push({
        rows: currentTable,
        page: page.number
      });
      inTable = false;
    }
  }
  
  return tables;
}
```

**Purpose**: Extract tables for special chunking (keep rows together).

---

## 13. Confidence Level Mapping

```javascript
function getConfidenceLevel(score) {
  if (score >= 0.70) return { level: 'high', color: 'green', emoji: '🟢' };
  if (score >= 0.40) return { level: 'medium', color: 'yellow', emoji: '🟡' };
  return { level: 'low', color: 'orange', emoji: '🟠' };
}
```

**Purpose**: Convert numeric confidence score to user-friendly level.

---

## 14. Batch IndexedDB Write

```javascript
async function batchWriteChunks(chunks, batchSize = 50) {
  const db = await openDB('doculearn_v3');
  
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    const tx = db.transaction('chunks', 'readwrite');
    const store = tx.objectStore('chunks');
    
    for (const chunk of batch) {
      await store.put(chunk);
    }
    
    await tx.done;
    
    // Notify progress
    postMessage({
      type: 'progress',
      done: Math.min(i + batchSize, chunks.length),
      total: chunks.length
    });
  }
}
```

**Purpose**: Write chunks to IndexedDB in batches to avoid UI jank.

---

**Next**: See `12-system-architecture.md` for the complete system diagram.
