import { v4 as uuidv4 } from 'uuid';
import { DoubtNode, NodeStatus, ConfidenceLevel } from '@/types/doubt-graph';
import { saveNode, getNodesByDoc, getNode } from './db';

const MAX_DEPTH = 4;
const MAX_CHILDREN = 5;

export async function createNewNode(
  question: string,
  doc_id: string,
  page_number: number,
  parent_id: string | null = null
): Promise<DoubtNode | { error: string }> {
  
  let depth = 0;
  if (parent_id) {
    const parent = await getNode(parent_id);
    if (!parent) return { error: "Parent node not found" };
    
    if (parent.depth >= MAX_DEPTH - 1) {
      return { error: "Maximum tree depth reached (4 levels)" };
    }
    
    // Check children count
    const allNodes = await getNodesByDoc(doc_id);
    const childrenCount = allNodes.filter(n => n.parent_id === parent_id).length;
    if (childrenCount >= MAX_CHILDREN) {
      return { error: "Maximum branches reached (5 children per node)" };
    }
    
    depth = parent.depth + 1;
  }

  const newNode: DoubtNode = {
    node_id: uuidv4(),
    parent_id,
    doc_id,
    page_number,
    question,
    context_chunks: [],
    retrieval_strategy: 'hybrid',
    status: 'pending',
    answer: '',
    confidence_score: 0,
    confidence_level: 'low',
    model_used: 'gemini-2.0-flash',
    tokens_used: 0,
    depth,
    created_at: new Date().toISOString(),
    completed_at: null,
  };

  await saveNode(newNode);
  return newNode;
}

import { searchChunks } from './db';

// Real AI execution with streaming
export async function* executeAINode(node_id: string, question: string, doc_id: string) {
  // 1. Retrieve context
  const chunks = await searchChunks(doc_id, question);
  const context = chunks.map(c => `[Page ${c.page_number}]: ${c.text}`).join('\n\n');
  
  // 2. Prepare prompt
  const systemPrompt = `You are a helpful AI assistant explaining a document. 
Use the provided context to answer the user's question. 
If the answer is not in the context, say you don't know based on the document.
Context:
${context}`;

  // 3. Call API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: question,
      deviceId: 'local-user', // In a real app, this would be a real ID
      systemPrompt,
      history: [] // Can be populated for multi-turn
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('API Error Response:', errorData);
    throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: Failed to fetch AI response`);
  }

  const data = await response.json();
  
  if (!data.content) {
    throw new Error("AI returned an empty response. Check your API keys and quota.");
  }
  
  // For now, since our API doesn't stream yet in the response, we return the content in chunks to simulate streaming UI
  const content = data.content;
  const words = content.split(' ');
  for (const word of words) {
    yield word + ' ';
    await new Promise(r => setTimeout(r, 20)); // Subtle delay for feel
  }
}

export function calculateConfidence(score: number): ConfidenceLevel {
  if (score >= 0.7) return 'high';
  if (score >= 0.4) return 'medium';
  return 'low';
}
