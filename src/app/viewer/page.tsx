'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Brain, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { parsePDF, chunkText } from '@/lib/document-processor';
import { saveDocument, saveChunks } from '@/lib/db';

export default function ViewerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt', '.md'],
    }
  });

  const startLearning = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const docId = uuidv4();
      
      const pages = await parsePDF(file);
      
      await saveDocument({
        doc_id: docId,
        name: file.name,
        format: 'pdf',
        file_size: file.size,
        total_pages: pages.length,
        indexing_status: 'pending',
        indexing_progress: 0,
        created_at: new Date().toISOString(),
        file: file
      });

      const chunks = chunkText(docId, pages);
      
      await saveChunks(chunks.map(c => ({
        chunk_id: uuidv4(),
        ...c,
        token_count: Math.ceil(c.text.length / 4),
        is_table: false,
        is_figure: false,
        is_math: false,
        has_image: false
      })));

      router.push(`/viewer/${docId}`);
      
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Failed to process document.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative px-4 overflow-hidden pt-10">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col h-full justify-between pb-8"
          >
            {/* Header Content */}
            <div className="flex flex-col items-center mt-12 space-y-4 text-center">
              <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-2 shadow-lg shadow-indigo-500/20">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">
                Upload a PDF <br/> <span className="text-muted-foreground">to begin</span>
              </h1>
              <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-4 leading-relaxed">
                Tap the button below to select a document from your device.
              </p>
            </div>

            {/* Feature List */}
            <div className="flex flex-col items-center gap-4 mt-auto mb-10">
              <SecurityFeature icon={<Lock className="w-4 h-4" />} text="100% Local Processing" />
              <SecurityFeature icon={<Brain className="w-4 h-4" />} text="AI-Powered Insights" />
            </div>

            {/* FAB Upload Button */}
            <div className="w-full flex justify-center pb-6">
              <div {...getRootProps()} className="focus:outline-none">
                <input {...getInputProps()} />
                <button className="flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full shadow-2xl shadow-indigo-600/40 active:scale-95 transition-transform">
                  <Upload className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="file-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-full items-center justify-center space-y-8"
          >
            <div className="relative w-full max-w-sm p-6 glass rounded-3xl border border-white/10 text-center flex flex-col items-center shadow-2xl shadow-black/40">
              <button 
                onClick={() => setFile(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              <div className="w-16 h-16 bg-indigo-500/10 rounded-[1.5rem] flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-indigo-400" />
              </div>
              
              <h2 className="text-xl font-bold truncate w-full px-2 mb-2">{file.name}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-8">
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="uppercase tracking-wider">{file.name.split('.').pop()}</span>
              </div>
              
              <button 
                onClick={startLearning}
                disabled={isProcessing}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Start Learning"
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SecurityFeature({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium bg-white/5 px-4 py-2 rounded-full border border-white/5">
      <div className="text-indigo-400/80">{icon}</div>
      <span className="text-xs tracking-wide">{text}</span>
    </div>
  );
}
