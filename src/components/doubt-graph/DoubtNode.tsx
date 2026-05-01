'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DoubtNode as DoubtNodeType, NodeStatus, ConfidenceLevel } from '@/types/doubt-graph';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, CircleDashed, AlertCircle, MessageSquarePlus, ChevronDown, ChevronUp } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DoubtNodeProps {
  node: DoubtNodeType;
  onAddChild: (parentId: string) => void;
  onToggleExpand: (nodeId: string) => void;
  isExpanded: boolean;
}

const statusConfig: Record<NodeStatus, { icon: React.ElementType; color: string }> = {
  pending: { icon: CircleDashed, color: 'text-gray-400' },
  streaming: { icon: CircleDashed, color: 'text-blue-500 animate-spin' },
  done: { icon: CheckCircle2, color: 'text-green-500' },
  error: { icon: AlertCircle, color: 'text-red-500' },
};

const confidenceConfig: Record<ConfidenceLevel, { label: string; color: string }> = {
  high: { label: 'High', color: 'bg-green-500/20 text-green-600' },
  medium: { label: 'Medium', color: 'bg-yellow-500/20 text-yellow-600' },
  low: { label: 'Low', color: 'bg-orange-500/20 text-orange-600' },
};

export const DoubtNode: React.FC<DoubtNodeProps> = ({ node, onAddChild, onToggleExpand, isExpanded }) => {
  const StatusIcon = statusConfig[node.status].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 relative"
    >
      <div 
        className={cn(
          "p-4 rounded-xl border transition-all cursor-pointer group hover:shadow-lg",
          "bg-white dark:bg-slate-900",
          node.status === 'streaming' ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-200 dark:border-slate-800",
          isExpanded ? "shadow-md" : ""
        )}
        onClick={() => onToggleExpand(node.node_id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <StatusIcon className={cn("w-4 h-4", statusConfig[node.status].color)} />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Node Depth: {node.depth}
              </span>
              {node.status === 'done' && (
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold uppercase", confidenceConfig[node.confidence_level].color)}>
                  {node.confidence_level}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {node.question}
            </h3>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(node.node_id);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors"
            title="Ask follow-up"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>
        </div>

        {isExpanded && node.answer && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 text-sm text-slate-600 dark:text-slate-400 border-t pt-3"
          >
            {node.answer}
          </motion.div>
        )}
        
        <div className="flex justify-center mt-1">
          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-300" />}
        </div>
      </div>
    </motion.div>
  );
};
