'use client';

import React, { useState, useEffect } from 'react';
import { DoubtNode as DoubtNodeType } from '@/types/doubt-graph';
import { getNodesByDoc, saveNode } from '@/lib/db';
import { createNewNode, executeAINode, calculateConfidence } from '@/lib/doubt-graph-engine';
import { DoubtNode } from './DoubtNode';
import { Plus, Trash2, Download, History, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GraphPanelProps {
  docId: string;
  currentPage: number;
}

export const GraphPanel: React.FC<GraphPanelProps> = ({ docId, currentPage }) => {
  const [nodes, setNodes] = useState<DoubtNodeType[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [parentIdForNewNode, setParentIdForNewNode] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNodes();
  }, [docId]);

  const loadNodes = async () => {
    const fetchedNodes = await getNodesByDoc(docId);
    setNodes(fetchedNodes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleAddNode = async () => {
    if (!newQuestion.trim()) return;

    const result = await createNewNode(newQuestion, docId, currentPage, parentIdForNewNode);
    
    if ('error' in result) {
      setError(result.error);
      return;
    }

    setNodes(prev => [...prev, result]);
    setNewQuestion('');
    setIsInputOpen(false);
    setError(null);

    // Start streaming simulation
    await runExecution(result.node_id, result.question);
  };

  const runExecution = async (nodeId: string, question: string) => {
    try {
      const stream = executeAINode(nodeId, question, docId);
      let fullAnswer = "";

      // Update status to streaming
      setNodes(prev => prev.map(n => n.node_id === nodeId ? { ...n, status: 'streaming' } : n));

      for await (const token of stream) {
        fullAnswer += token;
        setNodes(prev => prev.map(n => n.node_id === nodeId ? { ...n, answer: fullAnswer } : n));
        // Auto expand while streaming
        setExpandedNodes(prev => new Set(prev).add(nodeId));
      }

      // Finalize
      const score = 0.85; // This could be calculated from the AI response if supported
      const completedNode: Partial<DoubtNodeType> = {
        status: 'done',
        answer: fullAnswer.trim(),
        confidence_score: score,
        confidence_level: calculateConfidence(score),
        completed_at: new Date().toISOString()
      };

      setNodes(prev => {
        const updatedNodes = prev.map(n => n.node_id === nodeId ? { ...n, ...completedNode } as DoubtNodeType : n);
        const finalNode = updatedNodes.find(n => n.node_id === nodeId);
        if (finalNode) {
          saveNode(finalNode);
        }
        return updatedNodes;
      });

    } catch (err: any) {
      console.error('AI Execution failed:', err);
      setError(err.message || "AI failed to respond");
      setNodes(prev => prev.map(n => n.node_id === nodeId ? { ...n, status: 'error', answer: 'Error: ' + err.message } : n));
    }
  };

  const renderTree = (parentId: string | null = null, depth = 0) => {
    const children = nodes.filter(n => n.parent_id === parentId);
    if (children.length === 0) return null;

    return (
      <div className={parentId === null ? "flex flex-col gap-6" : "flex flex-col gap-4 ml-6 pl-4 border-l-2 border-slate-100 dark:border-slate-800"}>
        {children.map(node => (
          <div key={node.node_id}>
            <DoubtNode 
              node={node} 
              onAddChild={(pId) => {
                setParentIdForNewNode(pId);
                setIsInputOpen(true);
              }}
              onToggleExpand={handleToggleExpand}
              isExpanded={expandedNodes.has(node.node_id)}
            />
            {renderTree(node.node_id, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-black/40 border-l border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-8 bg-primary rounded-full" />
          <h2 className="text-lg font-bold tracking-tight">Doubt Graph</h2>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all">
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Graph Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Doubts Yet</h3>
            <p className="text-sm text-slate-500 max-w-[200px]">
              Ask your first question to start the exploration graph.
            </p>
          </div>
        ) : (
          renderTree()
        )}
      </div>

      {/* Input Section */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        {!isInputOpen ? (
          <button 
            onClick={() => {
              setParentIdForNewNode(null);
              setIsInputOpen(true);
            }}
            className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" />
            New Question
          </button>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {parentIdForNewNode ? "Follow-up Question" : "New Root Question"}
              </span>
              <button onClick={() => setIsInputOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              autoFocus
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Ask anything about the current page..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNode();
                }
              }}
            />
            {error && <span className="text-[10px] text-red-500 font-medium">{error}</span>}
            <div className="flex gap-2">
              <button 
                onClick={handleAddNode}
                disabled={!newQuestion.trim()}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-all hover:bg-primary/90"
              >
                Send Question
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
