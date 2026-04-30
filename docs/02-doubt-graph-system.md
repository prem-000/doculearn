# Doubt Graph System

**Core Concept**: Tree-based, non-linear Q&A system replacing traditional linear chat.

---

## 1. What Is the Doubt Graph?

Instead of a sequential Q&A thread, every question becomes a **node** in a tree. Follow-up questions become **child nodes**. Multiple branches can exist in parallel.

### Visual Example

```
                [Root: What is osmosis?]
                       |
      ┌────────────────┼────────────────┐
      |                |                |
[Why does water   [What is semi-   [Examples of
 move?]            permeable?]       osmosis?]
      |
[Is it pressure
 or concentration?]
```

---

## 2. Doubt Graph Rules

1. Each question = one node
2. Follow-up questions = child nodes of the parent node
3. Nodes are executed independently and asynchronously
4. **Maximum tree depth = 4 levels**
5. **Maximum child nodes per parent = 5**
6. Each node carries its own RAG context (not inherited from parent)
7. Nodes are persistent per document session (stored in IndexedDB)

---

## 3. Node Data Model

```json
{
  "node_id": "uuid-v4",
  "parent_id": "uuid-v4 | null",
  "doc_id": "string (hash of filename+size)",
  "page_number": "int",
  "question": "string",
  "context_chunks": ["chunk_id_1", "chunk_id_2"],
  "retrieval_strategy": "positional | semantic | hybrid",
  "status": "pending | streaming | done | error",
  "answer": "string",
  "confidence_score": "float (0.0 – 1.0)",
  "confidence_level": "high | medium | low",
  "model_used": "gemini_key_1 | gemini_key_2 | ollama_llama3",
  "tokens_used": "int",
  "depth": "int (0 = root)",
  "created_at": "ISO timestamp",
  "completed_at": "ISO timestamp | null"
}
```

---

## 4. Graph Execution Algorithm

```
ALGORITHM: GraphNodeExecution

INPUT: question, parent_node_id, current_page, doc_id

STEP 1 — Validate
  if depth(parent_node_id) >= 4: return error "Max depth reached"
  if child_count(parent_node_id) >= 5: return error "Max branches reached"

STEP 2 — Create Node
  node = create_node(question, parent_id, page_number, doc_id)
  node.status = "pending"
  save_to_indexeddb(node)

STEP 3 — RAG Retrieval
  if indexing_complete:
    chunks = hybrid_retrieve(question, current_page, doc_id)
  else:
    chunks = positional_retrieve(current_page, doc_id)

STEP 4 — Build Prompt
  prompt = build_prompt(node, chunks, parent_context)

STEP 5 — AI Generation
  stream = call_ai(prompt, key_rotator)
  node.status = "streaming"

STEP 6 — Stream to UI
  for token in stream:
    update_node_ui(node_id, token)

STEP 7 — Finalise
  node.answer = full_response
  node.confidence_score = compute_confidence(chunks, response)
  node.status = "done"
  save_to_indexeddb(node)
  save_to_supabase(node)  // optional cloud sync

OUTPUT: completed node with answer + confidence
```

---

## 5. Graph Storage — IndexedDB

**ObjectStore**: `node_graph`

- **key**: `node_id`
- **indexes**:
  - `by_doc_id` → filter all nodes for a document
  - `by_parent_id` → reconstruct tree structure
  - `by_page` → show nodes asked on a page
- **value**: full node object (see section 3)

---

## 6. Graph UI Specifications

### Panel Layout
- **Position**: Right side (collapsible on mobile)
- **Visualization**: Tree (top-down or radial, user choice)

### Node States

| State | Visual | Description |
|-------|--------|-------------|
| Pending | Grey, spinner | Waiting for AI response |
| Streaming | Blue, animated border | AI generating answer |
| Done/High | Green badge | High confidence (≥0.70) |
| Done/Med | Yellow badge | Medium confidence (0.40-0.69) |
| Done/Low | Orange badge | Low confidence (<0.40) |
| Error | Red badge | Failed to generate |

### Interactions

- **Click node** → expand answer below node
- **Long-press node** → "Ask follow-up" input opens
- **Swipe node left** → delete branch
- **Tap "+" on any node** → add child question
- **Breadcrumb trail** → shows path from root to selected node

### Controls

- **"New Question" button** → creates root node for current page
- **"Clear Graph"** → archive current graph, start fresh
- **"Export Graph"** → download Q&A tree as PDF or MD

---

## 7. Graph Execution Flow

```
User asks question
       ↓
Create node (pending)
       ↓
Retrieve context chunks (RAG)
       ↓
Build prompt with context
       ↓
Call AI API (streaming)
       ↓
Update UI token by token
       ↓
Calculate confidence score
       ↓
Mark node complete
       ↓
Save to IndexedDB + optional Supabase sync
```

---

**Next**: See `03-rag-pipeline.md` for the complete RAG system specification.
