'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Brain, Lock, ArrowRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
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
      
      // 1. Parse PDF
      const pages = await parsePDF(file);
      
      // 2. Save Document metadata and file blob
      await saveDocument({
        doc_id: docId,
        name: file.name,
        format: 'pdf',
        file_size: file.size,
        total_pages: pages.length,
        indexing_status: 'pending',
        indexing_progress: 0,
        created_at: new Date().toISOString(),
        file: file // Save the actual blob
      });

      // 3. Chunk text
      const chunks = chunkText(docId, pages);
      
      // 4. Save chunks to DB
      await saveChunks(chunks.map(c => ({
        chunk_id: uuidv4(),
        ...c,
        token_count: Math.ceil(c.text.length / 4),
        is_table: false,
        is_figure: false,
        is_math: false,
        has_image: false
      })));

      // 5. Redirect to viewer
      router.push(`/viewer/${docId}`);
      
    } catch (error) {
      console.error('Processing failed:', error);
      alert('Failed to process document. Please check the console.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background selection:bg-indigo-500/30">
      <AnimatePresence mode="wait">
        {!file ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl w-full text-center"
          >
            <div className="mb-12 space-y-6">
              <h1 className="text-5xl font-bold tracking-tight">
                Unlock your <span className="gradient-text">knowledge.</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Drop any document to start your deep-learning journey with AI-powered Doubt Graphs.
              </p>
            </div>

            <div 
              {...getRootProps()} 
              className={cn(
                "p-20 border-2 border-dashed rounded-[2.5rem] transition-all cursor-pointer group relative overflow-hidden",
                isDragActive ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 glass hover:border-indigo-500/30"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-8 relative z-10">
                <div className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500",
                  isDragActive ? "bg-indigo-500 scale-110 shadow-2xl shadow-indigo-500/50" : "bg-indigo-500/10 group-hover:scale-110"
                )}>
                  <Upload className={cn(
                    "w-10 h-10 transition-colors",
                    isDragActive ? "text-white" : "text-indigo-400"
                  )} />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    {isDragActive ? "Drop it here" : "Click or drag document"}
                  </p>
                  <p className="text-muted-foreground font-medium">PDF, DOCX, TXT, Markdown</p>
                </div>
              </div>
              
              {/* Animated Background glow on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="mt-16 flex justify-center gap-12">
              <SecurityFeature icon={<Lock className="w-5 h-5" />} text="100% Local" />
              <SecurityFeature icon={<Brain className="w-5 h-5" />} text="AI Chaining" />
              <SecurityFeature icon={<FileText className="w-5 h-5" />} text="Multi-Format" />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="max-w-lg w-full p-10 glass rounded-[2.5rem] border border-white/10 text-center space-y-8 relative overflow-hidden"
          >
            <button 
              onClick={() => setFile(null)}
              className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2rem] mx-auto flex items-center justify-center">
              <FileText className="w-12 h-12 text-indigo-400" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-bold truncate px-4">{file.name}</h2>
              <div className="flex items-center justify-center gap-3 text-muted-foreground font-medium">
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="uppercase text-xs tracking-widest">{file.name.split('.').pop()}</span>
              </div>
            </div>
            
            <div className="pt-4">
              <button 
                onClick={startLearning}
                disabled={isProcessing}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Start Learning
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
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
    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
      <div className="p-2.5 bg-white/5 rounded-xl text-indigo-400/80">{icon}</div>
      <span className="text-sm tracking-wide">{text}</span>
    </div>
  );
}
