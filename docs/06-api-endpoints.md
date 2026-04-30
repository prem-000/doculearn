# API Endpoints — Complete Specification

---

## Base URL

- **Production**: `https://doculearn.app/api`
- **Development**: `http://localhost:3000/api`

All endpoints are **PUBLIC** — no authentication required.

---

## 1. POST /api/chat

**Purpose**: Send a question + context chunks to AI, stream back response.

### Request Body

```json
{
  "node_id": "uuid",
  "question": "string",
  "context_chunks": [
    {
      "chunk_id": "string",
      "text": "string",
      "page_number": "int",
      "section_title": "string"
    }
  ],
  "chat_history": [
    { "role": "user | assistant", "content": "string" }
  ],
  "answering_mode": "strict | assist | hybrid",
  "stream": true,
  "parent_answer": "string | null"
}
```

### Response (stream: true)

```
Content-Type: text/event-stream

data: {"token": "The", "node_id": "uuid"}
data: {"token": " process", "node_id": "uuid"}
data: {"token": " of", "node_id": "uuid"}
...
data: {"done": true, "node_id": "uuid", "confidence": 0.87, "model": "gemini_key_1", "tokens_used": 412}
```

### Response (stream: false)

```json
{
  "node_id": "uuid",
  "answer": "string",
  "confidence_score": 0.87,
  "confidence_level": "high",
  "model_used": "gemini_key_1",
  "tokens_used": 412,
  "latency_ms": 1240
}
```

### Error Responses

```json
{ "error": "ALL_KEYS_EXHAUSTED", "retry_after_seconds": 45 }
{ "error": "OLLAMA_UNREACHABLE", "ollama_url": "http://localhost:11434" }
{ "error": "CONTEXT_TOO_LARGE", "max_tokens": 3700, "provided": 4200 }
```

---

## 2. POST /api/embed

**Purpose**: Optional server-side embedding for low-powered devices.

### Request Body

```json
{
  "texts": ["string", "string"],
  "model": "all-minilm-l6-v2"
}
```

### Response

```json
{
  "embeddings": [[0.12, -0.34, ...], [0.56, 0.78, ...]],
  "model": "all-minilm-l6-v2",
  "dimensions": 384,
  "latency_ms": 80
}
```

---

## 3. GET /api/keys/status

**Purpose**: Check which Gemini keys are available vs in cooldown.

### Response

```json
{
  "keys": [
    {
      "key_index": 0,
      "key_hash": "sha256_hash",
      "status": "available | cooldown | exhausted",
      "cooldown_until": "ISO timestamp | null",
      "request_count": 847,
      "last_used": "ISO timestamp"
    }
  ],
  "ollama_status": "available | unreachable | not_configured",
  "recommended_key": 1
}
```

---

## 4. POST /api/keys/rotate

**Purpose**: Manually trigger key rotation (mark current key as rate-limited).

### Request Body

```json
{
  "key_index": 0,
  "reason": "rate_limited | error | manual",
  "cooldown_minutes": 60
}
```

### Response

```json
{
  "previous_key": 0,
  "active_key": 1,
  "status": "rotated"
}
```

---

## 5. POST /api/node/save

**Purpose**: Sync a completed node to Supabase for cloud backup.

### Request Body

```json
{
  "node_id": "uuid",
  "parent_id": "uuid | null",
  "doc_id": "string",
  "doc_name": "string",
  "page_number": "int",
  "question": "string",
  "answer": "string",
  "confidence_score": 0.87,
  "model_used": "string",
  "depth": 2,
  "created_at": "ISO timestamp"
}
```

### Response

```json
{ "saved": true, "node_id": "uuid" }
```

---

## 6. GET /api/node/:doc_id

**Purpose**: Fetch all saved nodes for a document (restore graph from cloud).

### Query Params

```
?limit=100&offset=0&depth=4
```

### Response

```json
{
  "doc_id": "string",
  "nodes": [ /* array of node objects */ ],
  "total": 47,
  "tree_depth": 3
}
```

---

## 7. POST /api/exam/generate

**Purpose**: Generate MCQs or key concepts from a page's chunks.

### Request Body

```json
{
  "doc_id": "string",
  "page_number": "int",
  "chunks": [
    { "chunk_id": "string", "text": "string" }
  ],
  "mode": "mcq | key_concepts | summary | fill_blank",
  "count": 5
}
```

### Response

```json
{
  "mode": "mcq",
  "page_number": 12,
  "items": [
    {
      "question": "What is osmosis?",
      "options": {
        "A": "Movement of solute",
        "B": "Movement of water through semipermeable membrane",
        "C": "Chemical reaction",
        "D": "Diffusion of gas"
      },
      "correct": "B",
      "explanation": "string",
      "source_chunk_id": "string"
    }
  ]
}
```

---

## 8. GET /api/health (PUBLIC)

**Purpose**: Health check for monitoring.

### Response

```json
{
  "status": "ok",
  "version": "3.0",
  "gemini": "reachable",
  "supabase": "connected",
  "timestamp": "ISO timestamp"
}
```

---

## 9. POST /api/memory/update

**Purpose**: Update the memory system with a new question event.

### Request Body

```json
{
  "doc_id": "string",
  "topic": "string",
  "question": "string",
  "page_number": "int",
  "confidence_score": 0.45
}
```

### Response

```json
{
  "topic_score": 0.62,
  "weak_area": true,
  "revision_suggested": true
}
```

---

## 10. GET /api/memory/:device_id

**Purpose**: Fetch weak areas and revision suggestions for a device.

### Response

```json
{
  "weak_areas": [
    {
      "topic": "Osmosis",
      "doc_name": "Biology Chapter 5.pdf",
      "score": 0.34,
      "question_count": 8,
      "last_asked": "ISO timestamp",
      "suggested_action": "revise"
    }
  ],
  "total_questions": 142,
  "study_streak_days": 5
}
```

---

**Next**: See `07-ai-key-management.md` for Gemini key chaining and Ollama fallback.
