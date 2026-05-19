'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { GraphPanel } from '@/components/doubt-graph/GraphPanel';
import { useHotspotStore } from '@/lib/store';
import dynamic from 'next/dynamic';

import { MessageCircle } from 'lucide-react';

const PDFViewer = dynamic(() => import('@/components/pdf-viewer/PDFViewer').then(mod => mod.PDFViewer), { 
  ssr: false,
  loading: () => <div className="p-20 text-center text-muted-foreground animate-pulse">Initializing PDF Viewer...</div>
});

export default function DocumentViewer() {
  const { docId } = useParams() as { docId: string };
  const [doc, setDoc] = useState<{ file: Blob } | null>(null);
  const { setDocId, loadHotspots, chatOpen, setChatOpen } = useHotspotStore();

  useEffect(() => {
    if (docId) {
      setDocId(docId);
      loadHotspots(docId);
      getDocument(docId).then((data) => setDoc(data as { file: Blob } | null));
    }
  }, [docId, setDocId, loadHotspots]);

  if (!doc) return <div className="p-20 text-center">Loading document...</div>;

  return (
    <div className="flex h-full overflow-hidden bg-background relative">
      {/* Left: Document View */}
      <div className="flex-1 overflow-y-auto border-r border-border custom-scrollbar">
        <PDFViewer file={doc.file} />
      </div>

      {/* Floating Toggle Button when chat is closed */}
      {!chatOpen && (
        <button 
          onClick={() => setChatOpen(true)}
          className="absolute right-6 top-6 z-40 bg-primary text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 transition-transform"
          title="Open AI Chat"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Right: Doubt Graph Panel */}
      <div className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-slate-50 dark:bg-slate-900/30 ${chatOpen ? 'w-[500px] border-l border-border' : 'w-0 overflow-hidden border-none opacity-0'}`}>
        <GraphPanel docId={docId} currentPage={1} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
}
