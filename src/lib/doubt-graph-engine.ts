import { v4 as uuidv4 } from 'uuid';
import { DoubtNode, ConfidenceLevel } from '@/types/doubt-graph';
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
    model_used: 'gemini-2.5-flash',
    tokens_used: 0,
    depth,
    created_at: new Date().toISOString(),
    completed_at: null,
  };

  await saveNode(newNode);
  return newNode;
}

import { getChunksByPageRange } from './db';

// Real AI execution with streaming
export async function* executeAINode(node_id: string, question: string, doc_id: string) {
  // 1. Get Node to find its page number
  const node = await getNode(node_id);
  if (!node) throw new Error("Node not found");

  // 2. Retrieve context (Positional Strategy: N-1, N, N+1)
  const chunks = await getChunksByPageRange(doc_id, node.page_number);
  
  // Also include semantic search results if positional isn't enough? 
  // User asked for "based on the N+1, N, N-1 pages", so we strictly use those.
  const context = chunks
    .sort((a, b) => a.page_number - b.page_number)
    .map(c => `[Page ${c.page_number}]: ${c.text}`)
    .join('\n\n');
  
  // 3. Prepare prompt
  const systemPrompt = `You are a strict Document Analysis AI. 
The user has provided a PDF document (e.g., a Resume or technical doc), and you are analyzing it. 
Your goal is to answer questions EXCLUSIVELY based on the provided PDF context below.

CRITICAL RULES:
1. DO NOT ask the user to paste their content or provide the file. YOU ALREADY HAVE IT.
2. Only use the provided context (Pages ${node.page_number-1} to ${node.page_number+1}).
3. If the answer is NOT present in the provided context, you MUST say: "I'm sorry, but I cannot find the answer to this question within the specific pages of the document (Pages ${node.page_number-1}-${node.page_number+1})."
4. Do NOT use outside knowledge or assume things not in the text.
5. Analyze the text deeply to find subtle connections.
6. If the context is empty, state that no text was found on these pages.

Context from PDF:
${context}`;

  // 4. Call API
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: question,
      deviceId: '00000000-0000-0000-0000-000000000000', 
      systemPrompt,
      history: [] 
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
