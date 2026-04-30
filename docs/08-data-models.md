# Data Models — Supabase + IndexedDB

---

## 1. Supabase Schema

### 1.1 User Settings

```sql
CREATE TABLE user_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               TEXT NOT NULL,          -- device/session identifier
  gemini_keys_encrypted TEXT,            -- pgp_sym_encrypt(keys_json, secret)
  ollama_url            TEXT,
  ollama_model          TEXT DEFAULT 'llama3:8b',
  default_model         TEXT DEFAULT 'auto',
  answering_mode        TEXT DEFAULT 'hybrid',
  use_semantic          BOOLEAN DEFAULT TRUE,
  context_window        INT DEFAULT 1,   -- N±1 pages
  sync_nodes            BOOLEAN DEFAULT FALSE,
  updated_at            TIMESTAMP DEFAULT NOW()
);
```

### 1.2 API Key Usage

```sql
CREATE TABLE api_key_usage (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         TEXT NOT NULL,           -- device/session identifier
  key_index       INT NOT NULL,
  key_hash        TEXT NOT NULL,         -- sha256(key)
  status          TEXT DEFAULT 'available',
  cooldown_until  TIMESTAMP,
  request_count   INT DEFAULT 0,
  error_count     INT DEFAULT 0,
  last_used       TIMESTAMP,
  last_error      TEXT
);
```

### 1.3 Node Graph (Cloud Sync)

```sql
CREATE TABLE node_graph_sync (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          TEXT NOT NULL,           -- device/session identifier
  node_id          UUID NOT NULL,
  parent_id        UUID,
  doc_id           TEXT NOT NULL,
  doc_name         TEXT,
  page_number      INT,
  question         TEXT NOT NULL,
  answer           TEXT,
  confidence_score FLOAT,
  confidence_level TEXT,
  model_used       TEXT,
  depth            INT DEFAULT 0,
  tokens_used      INT,
  created_at       TIMESTAMP DEFAULT NOW(),
  completed_at     TIMESTAMP
);
```

### 1.4 Chat Sessions (Legacy / Export)

```sql
CREATE TABLE chat_sessions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT NOT NULL,           -- device/session identifier
  doc_name    TEXT,
  doc_hash    TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

### 1.5 Messages (Legacy / Export)

```sql
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL,         -- 'user' | 'assistant'
  content       TEXT NOT NULL,
  page_at_time  INT,
  model_used    TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
);
```

### 1.6 Memory System

```sql
CREATE TABLE user_memory (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           TEXT NOT NULL,           -- device/session identifier
  topic             TEXT NOT NULL,
  doc_id            TEXT,
  doc_name          TEXT,
  question_count    INT DEFAULT 0,
  avg_confidence    FLOAT DEFAULT 0.5,
  topic_score       FLOAT DEFAULT 0.5,
  last_asked        TIMESTAMP,
  revision_flag     BOOLEAN DEFAULT FALSE
);
```

---

## 2. IndexedDB Schema (Client)

**DATABASE**: `doculearn_v3`

### 2.1 Documents

```javascript
{
  name: 'documents',
  keyPath: 'doc_id',
  value: {
    doc_id: 'string',
    name: 'string',
    format: 'pdf | docx | pptx | txt | markdown | image',
    file_size: 'int',
    total_pages: 'int',
    indexing_status: 'pending | partial | complete',
    indexing_progress: 'int (0-100)',
    created_at: 'ISO timestamp'
  }
}
```

### 2.2 Chunks

```javascript
{
  name: 'chunks',
  keyPath: 'chunk_id',
  indexes: [
    { name: 'by_doc_id', keyPath: 'doc_id' },
    { name: 'by_page', keyPath: ['doc_id', 'page_number'] },
    { name: 'by_section', keyPath: ['doc_id', 'section_title'] }
  ],
  value: {
    chunk_id: 'string',
    doc_id: 'string',
    page_number: 'int',
    text: 'string',
    token_count: 'int',
    section_title: 'string',
    is_table: 'boolean',
    is_figure: 'boolean',
    is_math: 'boolean',
    has_image: 'boolean',
    image_ref: 'string | null'
  }
}
```

### 2.3 Embeddings

```javascript
{
  name: 'embeddings',
  keyPath: 'chunk_id',
  value: {
    chunk_id: 'string',
    doc_id: 'string',
    embedding: 'Float32Array (384-dim)',
    embedded_at: 'ISO timestamp'
  }
}
```

### 2.4 Node Graph

```javascript
{
  name: 'node_graph',
  keyPath: 'node_id',
  indexes: [
    { name: 'by_doc_id', keyPath: 'doc_id' },
    { name: 'by_parent_id', keyPath: 'parent_id' },
    { name: 'by_page', keyPath: ['doc_id', 'page_number'] }
  ],
  value: {
    // Full node object (see 02-doubt-graph-system.md, section 3)
    node_id: 'uuid',
    parent_id: 'uuid | null',
    doc_id: 'string',
    page_number: 'int',
    question: 'string',
    context_chunks: ['chunk_id_1', 'chunk_id_2'],
    retrieval_strategy: 'positional | semantic | hybrid',
    status: 'pending | streaming | done | error',
    answer: 'string',
    confidence_score: 'float',
    confidence_level: 'high | medium | low',
    model_used: 'string',
    tokens_used: 'int',
    depth: 'int',
    created_at: 'ISO timestamp',
    completed_at: 'ISO timestamp | null'
  }
}
```

### 2.5 Node Cache

```javascript
{
  name: 'node_cache',
  keyPath: 'node_id',
  value: {
    node_id: 'string',
    retrieved_chunks: ['chunk objects'],
    prompt_snapshot: 'string',
    cached_at: 'ISO timestamp'
  }
}
```

### 2.6 Chat History

```javascript
{
  name: 'chat_history',
  keyPath: 'session_id',
  value: {
    session_id: 'string',
    doc_id: 'string',
    page_at_time: 'int',
    messages: [
      { role: 'user | assistant', content: 'string', timestamp: 'ISO' }
    ]
  }
}
```

### 2.7 Memory

```javascript
{
  name: 'memory',
  keyPath: 'topic',
  indexes: [
    { name: 'by_score', keyPath: 'topic_score' }
  ],
  value: {
    topic: 'string',
    doc_id: 'string',
    question_count: 'int',
    avg_confidence: 'float',
    topic_score: 'float',
    last_asked: 'ISO timestamp'
  }
}
```

---

## 3. Data Flow

### Document Upload Flow

```
1. User selects file
2. Compute doc_id (SHA-256 hash)
3. Check IndexedDB: already indexed?
   - YES: Load existing chunks + embeddings
   - NO: Continue to step 4
4. Parse document (pdf.js / mammoth / pptx2json)
5. Save to IndexedDB 'documents' store
6. Chunk document
7. Save chunks to IndexedDB 'chunks' store
8. Start Web Worker embedding
9. Worker saves embeddings to IndexedDB 'embeddings' store
10. Update 'documents' indexing_status to 'complete'
```

### Question Flow

```
1. User asks question
2. Create node in IndexedDB 'node_graph'
3. Retrieve chunks (positional + semantic)
4. Build prompt
5. Call /api/chat
6. Stream response to UI
7. Update node in IndexedDB
8. Optional: Sync to Supabase 'node_graph_sync'
```

### Memory Update Flow

```
1. Node completed
2. Extract topic from question (NLP / keyword extraction)
3. Update IndexedDB 'memory' store
4. Optional: Sync to Supabase 'user_memory'
5. Check if topic_score < 0.4 → mark as weak area
```

---

**Next**: See `09-feature-specifications.md` for UI/UX details.
