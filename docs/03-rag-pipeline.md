# RAG Pipeline — Full Specification

The RAG pipeline is the core intelligence engine. It runs primarily in the browser.

---

## 1. Overview

**Key Principle**: Only retrieved text chunks are sent to AI — never the full document.

### Full RAG Flow

```
File Open
  → INGESTION: Parse → Chunk → Embed (Web Worker, background)
  → RETRIEVAL: Question → Positional + Semantic → Merge → Re-rank
  → GENERATION: Prompt → Gemini/Ollama → Stream → Node answer
```

---

## 2. Progressive Retrieval — Three Phases

### PHASE 1: INSTANT (0–2 seconds after file open)
```
├── Source: Pages N-1, N, N+1 extracted synchronously
├── No embedding required
├── Chatbot / Doubt Graph immediately available
└── Answer quality: Good for page-level questions
```

### PHASE 2: PARTIAL SEMANTIC (2–10 seconds)
```
├── Embed current page + ±10 surrounding pages
├── Enable similarity search within local window
└── Answer quality: Better for section-level questions
```

### PHASE 3: FULL DOCUMENT (background, 10s – several minutes)
```
├── Worker indexes entire document lazily
├── Priority queue: headings → current area → rest
└── Answer quality: Best for cross-document questions
```

---

## 3. Retrieval Algorithms

### 3.1 Positional Retrieval

```
ALGORITHM: PositionalRetrieve

INPUT: current_page (N), doc_id, k=6

STEP 1: Fetch chunks where page_number IN [N-1, N, N+1]
STEP 2: Sort by page_number ASC
STEP 3: Trim to k chunks by token budget (max 1200 tokens)
STEP 4: Tag each chunk with positional_boost = 1.0

OUTPUT: list of chunks with positional_boost scores
```

### 3.2 Semantic Retrieval

```
ALGORITHM: SemanticRetrieve

INPUT: question (string), doc_id, k=8, page_window=None

STEP 1: Embed question
  embedding = Transformers.js.embed(question)  // 384-dim Float32Array

STEP 2: Load candidate chunks from IndexedDB
  if page_window:
    candidates = IndexedDB.query(doc_id, page_range=[N-10, N+10])
  else:
    candidates = IndexedDB.getAll(doc_id)

STEP 3: Compute cosine similarity
  for each chunk in candidates:
    chunk.score = cosine_similarity(embedding, chunk.embedding)

STEP 4: Filter and rank
  filtered = chunks where score > 0.25  // threshold
  ranked = sort(filtered, by=score, DESC)

STEP 5: Return top-K
  return ranked[:k]

OUTPUT: list of chunks with similarity scores
```

### 3.3 Hierarchical Retrieval

```
ALGORITHM: HierarchicalRetrieve

INPUT: question, doc_id, current_page

STEP 1 — Page Filter
  candidate_pages = [N-3, N-2, N-1, N, N+1, N+2, N+3]

STEP 2 — Section Filter
  sections = group_chunks_by_heading(candidate_pages)
  relevant_sections = embed_and_rank_sections(question, sections)
  top_sections = relevant_sections[:3]

STEP 3 — Chunk Retrieval within Sections
  for each section in top_sections:
    chunks = semantic_retrieve(question, section.chunks, k=3)

STEP 4 — Merge + Deduplicate
  all_chunks = flatten(chunks_from_all_sections)
  deduplicated = remove_duplicates(all_chunks, by=chunk_id)

STEP 5 — Final Ranking
  final = sort(deduplicated, by=score, DESC)[:8]

OUTPUT: top 8 chunks ranked by relevance
```

### 3.4 Dual Retrieval Merge

```
ALGORITHM: DualMerge

INPUT: positional_chunks, semantic_chunks

STEP 1: Combine
  all = positional_chunks + semantic_chunks

STEP 2: Deduplicate by chunk_id
  seen = {}
  unique = []
  for chunk in all:
    if chunk.chunk_id not in seen:
      unique.append(chunk)
      seen.add(chunk.chunk_id)

STEP 3: Score merge
  for chunk in unique:
    pos_boost = 0.4 if chunk in positional_chunks else 0.0
    sem_score = chunk.similarity_score if chunk in semantic_chunks else 0.0
    chunk.final_score = (sem_score × 0.6) + pos_boost

STEP 4: Sort + truncate
  result = sort(unique, by=final_score, DESC)[:8]

OUTPUT: top 8 merged and scored chunks
```

---

## 4. Confidence Scoring

```
ALGORITHM: ConfidenceScore

INPUT: retrieved_chunks, ai_answer

similarity_score   = average(chunk.similarity_score for chunk in retrieved_chunks)
context_coverage   = min(total_chunk_tokens / 800, 1.0)
confidence         = (similarity_score × 0.6) + (context_coverage × 0.4)

if confidence >= 0.70: level = "high"
if confidence >= 0.40: level = "medium"
if confidence <  0.40: level = "low"

OUTPUT: { score: float, level: "high|medium|low" }
```

---

## 5. Hybrid Answering Modes

```
ALGORITHM: AnsweringMode

MODE = strict | assist | hybrid

if MODE == "strict":
  if confidence < 0.30:
    return "I could not find this in the document."
  else:
    answer using ONLY document chunks

if MODE == "assist":
  answer using document chunks + general knowledge
  label general knowledge sections clearly

if MODE == "hybrid":
  if confidence >= 0.50:
    answer using ONLY document chunks
  else:
    answer using document chunks + general knowledge fallback
    add disclaimer: "Supplemented with general knowledge"
```

---

## 6. Prompt Construction

### System Prompt

```
You are DocuLearn AI, an expert study assistant. Your job: help students 
understand the document they are reading.

Rules:
- Answer ONLY from the provided document context (strict mode)
- Be concise and clear — the student is reading, not writing a paper
- If asked for examples, use only examples present in the document
- If you cannot find the answer: say exactly "I could not find this in the document."
- Do not repeat the question back
```

### User Prompt Template

```
DOCUMENT: {doc_name}

PRIMARY CONTEXT (pages {N-1}, {N}, {N+1} — student's current reading area):
{positional_chunks_text}

ADDITIONAL CONTEXT (semantically relevant sections from document):
{semantic_chunks_text}

PARENT QUESTION (if this is a follow-up):
{parent_question}: {parent_answer_summary}

CONVERSATION HISTORY (last 6 turns):
{history}

STUDENT QUESTION:
{question}
```

---

## 7. Token Budget

| Slot | Budget |
|------|--------|
| System prompt | 250 tokens |
| Primary context (N-1, N, N+1) | 1,200 tokens |
| Semantic chunks (top 5) | 1,500 tokens |
| Parent context (follow-up only) | 300 tokens |
| Chat history (last 6 turns) | 800 tokens |
| Question | 100 tokens |
| **TOTAL INPUT** | **~4,150 tokens** |
| Max output | 1,000 tokens |
| Safety buffer | 850 tokens |
| **TOTAL** | **~6,000 tokens** (within Gemini 1.5 Flash limit) |

---

**Next**: See `04-chunking-strategy.md` for document processing details.
