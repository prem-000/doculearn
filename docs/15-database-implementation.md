# Database Implementation Guide

**Version**: 1.0.0  
**Status**: Implementation Ready  
**Date**: 2025

---

## Overview

This document provides implementation details for the DocuLearn AI database layer, including setup instructions, usage examples, and best practices.

---

## 1. File Structure

```
doculearn-ai/
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql       # Core tables + RLS
│       └── 002_helper_functions.sql     # Analytics + utilities
├── src/
│   ├── types/
│   │   ├── database.ts                  # TypeScript interfaces
│   │   └── doubt-graph.ts               # Existing types
│   └── lib/
│       ├── indexeddb.ts                 # IndexedDB wrapper
│       ├── supabase-client.ts           # Supabase client
│       ├── supabase-operations.ts       # Database operations
│       └── data-sync.ts                 # Cloud sync manager
└── .env.example                         # Environment variables
```

---

## 2. Setup Instructions

### 2.1 Supabase Setup

1. **Create Supabase Project**
   ```bash
   # Visit https://supabase.com/dashboard
   # Create new project
   # Note your project URL and anon key
   ```

2. **Run Migrations**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login to Supabase
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Run migrations
   supabase db push
   ```

3. **Verify Tables**
   ```sql
   -- In Supabase SQL Editor
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Should show:
   -- user_settings
   -- api_key_usage
   -- node_graph_sync
   -- chat_sessions
   -- messages
   -- user_memory
   ```

### 2.2 Environment Configuration

1. **Copy environment template**
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in values**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_ENCRYPTION_SECRET=generate-random-32-char-string
   ```

3. **Generate encryption secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### 2.3 Install Dependencies

```bash
npm install @supabase/supabase-js
```

---

## 3. Usage Examples

### 3.1 IndexedDB Operations

```typescript
import { getIndexedDB } from '@/lib/indexeddb';
import type { Document, Chunk, NodeGraph } from '@/types/database';

// Initialize database
const db = getIndexedDB();
await db.init();

// Save a document
const doc: Document = {
  doc_id: 'abc123',
  name: 'Calculus Textbook.pdf',
  format: 'pdf',
  file_size: 5242880,
  total_pages: 250,
  indexing_status: 'pending',
  indexing_progress: 0,
  created_at: new Date().toISOString(),
};
await db.saveDocument(doc);

// Save chunks
const chunks: Chunk[] = [
  {
    chunk_id: 'chunk_1',
    doc_id: 'abc123',
    page_number: 1,
    text: 'Introduction to Calculus...',
    token_count: 150,
    section_title: 'Chapter 1',
    is_table: false,
    is_figure: false,
    is_math: true,
    has_image: false,
    image_ref: null,
  },
  // ... more chunks
];
await db.saveChunks(chunks);

// Create a node
const node: NodeGraph = {
  node_id: crypto.randomUUID(),
  parent_id: null,
  doc_id: 'abc123',
  doc_name: 'Calculus Textbook.pdf',
  page_number: 1,
  question: 'What is a derivative?',
  context_chunks: ['chunk_1', 'chunk_2'],
  retrieval_strategy: 'hybrid',
  status: 'pending',
  answer: null,
  confidence_score: null,
  confidence_level: null,
  model_used: null,
  tokens_used: null,
  depth: 0,
  created_at: new Date().toISOString(),
  completed_at: null,
};
await db.saveNode(node);

// Query nodes by document
const docNodes = await db.getNodesByDocId('abc123');

// Query nodes by page
const pageNodes = await db.getNodesByPage('abc123', 1);

// Get root nodes (no parent)
const rootNodes = await db.getRootNodes('abc123');
```

### 3.2 Supabase Operations

```typescript
import {
  getUserSettings,
  updateUserSettings,
  getApiKeyUsage,
  syncNode,
  updateMemoryTopic,
} from '@/lib/supabase-operations';

// Get user settings
const settings = await getUserSettings();

// Update settings
await updateUserSettings({
  ollama_url: 'http://localhost:11434',
  use_semantic: true,
  sync_nodes: true,
});

// Get API key usage
const keyUsage = await getApiKeyUsage();

// Sync a node to cloud
await syncNode({
  user_id: 'device-uuid',
  node_id: node.node_id,
  parent_id: node.parent_id,
  doc_id: node.doc_id,
  doc_name: node.doc_name,
  page_number: node.page_number,
  question: node.question,
  answer: node.answer,
  confidence_score: node.confidence_score,
  confidence_level: node.confidence_level,
  model_used: node.model_used,
  depth: node.depth,
  tokens_used: node.tokens_used,
  completed_at: node.completed_at,
});

// Update memory topic
await updateMemoryTopic('derivatives', 'abc123', {
  question_count: 5,
  avg_confidence: 0.65,
  topic_score: 0.6,
  last_asked: new Date().toISOString(),
});
```

### 3.3 Data Sync

```typescript
import { getSyncManager } from '@/lib/data-sync';

// Initialize sync manager
const syncManager = getSyncManager();
await syncManager.init();

// Enable sync
syncManager.setEnabled(true);

// Start auto-sync (every 1 minute)
syncManager.startAutoSync();

// Manually sync a single node
await syncManager.syncSingleNode(node);

// Sync all pending nodes
const syncedCount = await syncManager.syncPendingNodes();
console.log(`Synced ${syncedCount} nodes`);

// Sync all nodes for a document
await syncManager.syncDocumentNodes('abc123');

// Get sync status
const status = syncManager.getStatus();
console.log('Sync enabled:', status.enabled);
console.log('Auto-sync:', status.autoSync);
console.log('Currently syncing:', status.isSyncing);
```

---

## 4. Data Flow Examples

### 4.1 Document Upload Flow

```typescript
import { getIndexedDB } from '@/lib/indexeddb';
import { createHash } from 'crypto';

async function handleDocumentUpload(file: File) {
  const db = getIndexedDB();
  
  // 1. Compute doc_id (SHA-256 hash)
  const buffer = await file.arrayBuffer();
  const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');
  const doc_id = hash;
  
  // 2. Check if already indexed
  const existing = await db.getDocument(doc_id);
  if (existing && existing.indexing_status === 'complete') {
    console.log('Document already indexed');
    return existing;
  }
  
  // 3. Save document metadata
  const doc: Document = {
    doc_id,
    name: file.name,
    format: getFileFormat(file.name),
    file_size: file.size,
    total_pages: 0, // Will be updated after parsing
    indexing_status: 'pending',
    indexing_progress: 0,
    created_at: new Date().toISOString(),
  };
  await db.saveDocument(doc);
  
  // 4. Parse document (pdf.js / mammoth / etc.)
  const pages = await parseDocument(file);
  
  // 5. Update total pages
  doc.total_pages = pages.length;
  await db.saveDocument(doc);
  
  // 6. Chunk document
  const chunks = await chunkDocument(pages, doc_id);
  await db.saveChunks(chunks);
  
  // 7. Start embedding (Web Worker)
  startEmbeddingWorker(chunks, doc_id);
  
  return doc;
}
```

### 4.2 Question Flow

```typescript
import { getIndexedDB } from '@/lib/indexeddb';
import { getSyncManager } from '@/lib/data-sync';

async function handleQuestion(
  question: string,
  docId: string,
  pageNumber: number,
  parentId: string | null = null
) {
  const db = getIndexedDB();
  const syncManager = getSyncManager();
  
  // 1. Create node
  const node: NodeGraph = {
    node_id: crypto.randomUUID(),
    parent_id: parentId,
    doc_id: docId,
    doc_name: null,
    page_number: pageNumber,
    question,
    context_chunks: [],
    retrieval_strategy: 'hybrid',
    status: 'pending',
    answer: null,
    confidence_score: null,
    confidence_level: null,
    model_used: null,
    tokens_used: null,
    depth: parentId ? await getNodeDepth(parentId) + 1 : 0,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  await db.saveNode(node);
  
  // 2. Retrieve chunks (RAG)
  const chunks = await retrieveRelevantChunks(question, docId, pageNumber);
  node.context_chunks = chunks.map(c => c.chunk_id);
  await db.saveNode(node);
  
  // 3. Build prompt
  const prompt = buildPrompt(node, chunks);
  
  // 4. Call AI API (streaming)
  node.status = 'streaming';
  await db.saveNode(node);
  
  const response = await callAIAPI(prompt);
  
  // 5. Update node with answer
  node.answer = response.text;
  node.confidence_score = response.confidence;
  node.confidence_level = getConfidenceLevel(response.confidence);
  node.model_used = response.model;
  node.tokens_used = response.tokens;
  node.status = 'done';
  node.completed_at = new Date().toISOString();
  await db.saveNode(node);
  
  // 6. Sync to cloud (if enabled)
  await syncManager.syncSingleNode(node);
  
  return node;
}
```

---

## 5. Best Practices

### 5.1 IndexedDB

- **Always initialize**: Call `db.init()` before any operations
- **Batch operations**: Use `saveChunks()` instead of multiple `saveChunk()` calls
- **Clean up**: Delete related data when deleting documents
- **Error handling**: Wrap operations in try-catch blocks

### 5.2 Supabase

- **RLS is enabled**: All queries automatically filtered by device/session ID
- **Use typed client**: Import `Database` type for full type safety
- **Batch sync**: Use `batchSyncNodes()` for multiple nodes
- **Handle identity**: Ensure device identifier is initialized before operations

### 5.3 Data Sync

- **Optional by default**: Respect user's `sync_nodes` setting
- **Sync completed nodes**: Only sync nodes with `status: 'done'`
- **Handle offline**: Queue operations when offline
- **Avoid duplicates**: Use `upsert` with `node_id` conflict resolution

---

## 6. Performance Optimization

### 6.1 IndexedDB Indexes

All critical queries are indexed:
- `by_doc_id` - Fast document filtering
- `by_page` - Fast page-based queries
- `by_parent_id` - Fast tree traversal
- `by_created_at` - Fast chronological queries

### 6.2 Batch Operations

```typescript
// ❌ Slow: Individual inserts
for (const chunk of chunks) {
  await db.saveChunk(chunk);
}

// ✅ Fast: Batch insert
await db.saveChunks(chunks);
```

### 6.3 Lazy Loading

```typescript
// ❌ Load all nodes upfront
const allNodes = await db.getNodesByDocId(docId);

// ✅ Load only visible nodes
const rootNodes = await db.getRootNodes(docId);
// Load children on demand when node is expanded
```

---

## 7. Security Considerations

### 7.1 Row Level Security (RLS)

All Supabase tables have RLS enabled. Data isolation is maintained through device/session identifiers rather than user accounts.

### 7.2 API Key Encryption

```typescript
// ❌ Never store keys in plain text
await supabase.from('user_settings').update({
  gemini_keys: JSON.stringify(keys) // WRONG
});

// ✅ Always encrypt
const encrypted = await encryptGeminiKeys(keys);
await supabase.from('user_settings').update({
  gemini_keys_encrypted: encrypted
});
```

### 7.3 Client-Side Data

- Documents never leave the browser
- Only retrieved chunks sent to AI APIs
- IndexedDB data is per-origin (isolated)

---

## 8. Troubleshooting

### 8.1 IndexedDB Issues

**Problem**: Database won't initialize
```typescript
// Check browser support
if (!window.indexedDB) {
  console.error('IndexedDB not supported');
}

// Clear corrupted database
await indexedDB.deleteDatabase('doculearn_v3');
```

**Problem**: Quota exceeded
```typescript
// Check storage usage
const estimate = await navigator.storage.estimate();
console.log(`Used: ${estimate.usage} / ${estimate.quota}`);

// Request persistent storage
await navigator.storage.persist();
```

### 8.2 Supabase Issues

**Problem**: RLS blocking queries
```sql
-- Check policies in Supabase dashboard
SELECT * FROM pg_policies WHERE tablename = 'user_settings';
```

**Problem**: Identity not working
```typescript
// Check device identifier
const deviceId = localStorage.getItem('device_id');
console.log('Device ID:', deviceId);
```

---

## 9. Testing

### 9.1 Unit Tests

```typescript
import { getIndexedDB } from '@/lib/indexeddb';

describe('IndexedDB Operations', () => {
  let db: IndexedDBManager;
  
  beforeEach(async () => {
    db = getIndexedDB();
    await db.init();
  });
  
  afterEach(async () => {
    await db.clear('documents');
    await db.clear('chunks');
    await db.clear('node_graph');
  });
  
  it('should save and retrieve document', async () => {
    const doc: Document = {
      doc_id: 'test123',
      name: 'Test.pdf',
      format: 'pdf',
      file_size: 1000,
      total_pages: 10,
      indexing_status: 'complete',
      indexing_progress: 100,
      created_at: new Date().toISOString(),
    };
    
    await db.saveDocument(doc);
    const retrieved = await db.getDocument('test123');
    
    expect(retrieved).toEqual(doc);
  });
});
```

---

## 10. Migration Guide

### 10.1 Adding New Tables

1. Create migration file: `003_new_feature.sql`
2. Add table definition with RLS
3. Update `database.ts` types
4. Add operations in `supabase-operations.ts`
5. Run migration: `supabase db push`

### 10.2 Schema Changes

```sql
-- Example: Add column to existing table
ALTER TABLE user_settings 
ADD COLUMN new_feature BOOLEAN DEFAULT FALSE;

-- Update RLS policies if needed
-- Update TypeScript types
```

---

**Next**: See `09-feature-specifications.md` for UI implementation details.
