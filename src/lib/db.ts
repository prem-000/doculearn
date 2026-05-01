import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface DocuLearnDB extends DBSchema {
  documents: {
    key: string;
    value: {
      doc_id: string;
      name: string;
      format: 'pdf' | 'docx' | 'pptx' | 'txt' | 'markdown' | 'image';
      file_size: number;
      total_pages: number;
      indexing_status: 'pending' | 'partial' | 'complete';
      indexing_progress: number;
      created_at: string;
      file: Blob; // Store the original file for the viewer
    };
  };
  chunks: {
    key: string;
    value: {
      chunk_id: string;
      doc_id: string;
      page_number: number;
      text: string;
      token_count: number;
      section_title?: string;
      is_table: boolean;
      is_figure: boolean;
      is_math: boolean;
      has_image: boolean;
      image_ref?: string | null;
    };
    indexes: { 
      'by_doc_id': string;
      'by_page': [string, number];
      'by_section': [string, string];
    };
  };
  embeddings: {
    key: string;
    value: {
      chunk_id: string;
      doc_id: string;
      embedding: Float32Array;
      embedded_at: string;
    };
    indexes: { 'by_doc_id': string };
  };
  node_graph: {
    key: string;
    value: {
      node_id: string;
      parent_id: string | null;
      doc_id: string;
      page_number: number;
      question: string;
      context_chunks: string[];
      retrieval_strategy: 'positional' | 'semantic' | 'hybrid';
      status: 'pending' | 'streaming' | 'done' | 'error';
      answer: string;
      confidence_score: number;
      confidence_level: 'high' | 'medium' | 'low';
      model_used: string;
      tokens_used: number;
      depth: number;
      hotspot_id?: string;
      created_at: string;
      completed_at: string | null;
    };
    indexes: {
      'by_doc_id': string;
      'by_parent_id': string;
      'by_page': [string, number];
    };
  };
  hotspots: {
    key: string;
    value: {
      id: string;
      pdf_id: string;
      page: number;
      shape: {
        type: "circle";
        cx: number;
        cy: number;
        r: number;
      };
      text?: string;
      question?: string;
      answer?: string;
      created_at: number;
    };
    indexes: {
      'by_pdf_id': string;
    };
  };
  chat_history: {
    key: string;
    value: {
      session_id: string;
      doc_id: string;
      page_at_time: number;
      messages: {
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }[];
    };
  };
  memory: {
    key: string;
    value: {
      topic: string;
      doc_id: string;
      question_count: number;
      avg_confidence: number;
      topic_score: number;
      last_asked: string;
    };
    indexes: { 'by_score': number };
  };
}

let dbPromise: Promise<IDBPDatabase<DocuLearnDB>>;

export const initDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<DocuLearnDB>('doculearn_v3', 2, {
      upgrade(db) {
        // Documents
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'doc_id' });
        }

        // Chunks
        if (!db.objectStoreNames.contains('chunks')) {
          const chunkStore = db.createObjectStore('chunks', { keyPath: 'chunk_id' });
          chunkStore.createIndex('by_doc_id', 'doc_id');
          chunkStore.createIndex('by_page', ['doc_id', 'page_number']);
          chunkStore.createIndex('by_section', ['doc_id', 'section_title']);
        }

        // Embeddings
        if (!db.objectStoreNames.contains('embeddings')) {
          const embeddingStore = db.createObjectStore('embeddings', { keyPath: 'chunk_id' });
          embeddingStore.createIndex('by_doc_id', 'doc_id');
        }

        // Node Graph
        if (!db.objectStoreNames.contains('node_graph')) {
          const graphStore = db.createObjectStore('node_graph', { keyPath: 'node_id' });
          graphStore.createIndex('by_doc_id', 'doc_id');
          graphStore.createIndex('by_parent_id', 'parent_id');
          graphStore.createIndex('by_page', ['doc_id', 'page_number']);
        }

        // Hotspots
        if (!db.objectStoreNames.contains('hotspots')) {
          const hotspotStore = db.createObjectStore('hotspots', { keyPath: 'id' });
          hotspotStore.createIndex('by_pdf_id', 'pdf_id');
        }

        // Chat History
        if (!db.objectStoreNames.contains('chat_history')) {
          db.createObjectStore('chat_history', { keyPath: 'session_id' });
        }

        // Memory
        if (!db.objectStoreNames.contains('memory')) {
          const memoryStore = db.createObjectStore('memory', { keyPath: 'topic' });
          memoryStore.createIndex('by_score', 'topic_score');
        }
      },
    });
  }
  return dbPromise;
};

// Documents
export async function saveDocument(doc: DocuLearnDB['documents']['value']) {
  const db = await initDB();
  return db.put('documents', doc);
}

export async function getDocument(doc_id: string) {
  const db = await initDB();
  return db.get('documents', doc_id);
}

// Chunks
export async function saveChunks(chunks: DocuLearnDB['chunks']['value'][]) {
  const db = await initDB();
  const tx = db.transaction('chunks', 'readwrite');
  await Promise.all([
    ...chunks.map(chunk => tx.store.put(chunk)),
    tx.done
  ]);
}

export async function getChunksByDoc(doc_id: string) {
  const db = await initDB();
  return db.getAllFromIndex('chunks', 'by_doc_id', doc_id);
}

export async function getChunksByPage(doc_id: string, page_number: number) {
  const db = await initDB();
  return db.getAllFromIndex('chunks', 'by_page', [doc_id, page_number]);
}

export async function getChunksByPageRange(doc_id: string, page_number: number) {
  const db = await initDB();
  const pages = [page_number - 1, page_number, page_number + 1].filter(p => p > 0);
  
  const chunkPromises = pages.map(p => db.getAllFromIndex('chunks', 'by_page', [doc_id, p]));
  const results = await Promise.all(chunkPromises);
  return results.flat();
}

// Node Graph
export async function saveNode(node: DocuLearnDB['node_graph']['value']) {
  const db = await initDB();
  return db.put('node_graph', node);
}

export async function getNode(node_id: string) {
  const db = await initDB();
  return db.get('node_graph', node_id);
}

export async function getNodesByDoc(doc_id: string) {
  const db = await initDB();
  return db.getAllFromIndex('node_graph', 'by_doc_id', doc_id);
}

// Hotspots
export async function saveHotspot(hotspot: DocuLearnDB['hotspots']['value']) {
  const db = await initDB();
  return db.put('hotspots', hotspot);
}

export async function getHotspotsByDoc(pdf_id: string) {
  const db = await initDB();
  return db.getAllFromIndex('hotspots', 'by_pdf_id', pdf_id);
}

// Search chunks for RAG
export async function searchChunks(doc_id: string, query: string, limit = 5) {
  const chunks = await getChunksByDoc(doc_id);
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  if (searchTerms.length === 0) return chunks.slice(0, limit);

  const scoredChunks = chunks.map(chunk => {
    let score = 0;
    const text = chunk.text.toLowerCase();
    searchTerms.forEach(term => {
      if (text.includes(term)) score += 1;
    });
    return { ...chunk, score };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .filter(c => c.score > 0)
    .slice(0, limit);
}
