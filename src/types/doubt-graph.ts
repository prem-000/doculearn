export type NodeStatus = "pending" | "streaming" | "done" | "error";
export type RetrievalStrategy = "positional" | "semantic" | "hybrid";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface DoubtNode {
  node_id: string;
  parent_id: string | null;
  doc_id: string;
  page_number: number;
  question: string;
  context_chunks: string[];
  retrieval_strategy: RetrievalStrategy;
  status: NodeStatus;
  answer: string;
  confidence_score: number;
  confidence_level: ConfidenceLevel;
  model_used: string;
  tokens_used: number;
  depth: number;
  created_at: string;
  completed_at: string | null;
}

export interface GraphStore {
  nodes: DoubtNode[];
}
