'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getDocument } from '@/lib/db';
import { GraphPanel } from '@/components/doubt-graph/GraphPanel';
import { useHotspotStore } from '@/lib/store';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/components/pdf-viewer/PDFViewer').then(mod => mod.PDFViewer), { 
  ssr: false,
  loading: () => <div className="p-20 text-center text-muted-foreground animate-pulse">Initializing PDF Viewer...</div>
});

export default function DocumentViewer() {
  const { docId } = useParams() as { docId: string };
  const [doc, setDoc] = useState<{ file: Blob } | null>(null);
  const { setDocId, loadHotspots } = useHotspotStore();

  useEffect(() => {
    if (docId) {
      setDocId(docId);
      loadHotspots(docId);
      getDocument(docId).then((data) => setDoc(data as { file: Blob } | null));
    }
  }, [docId, setDocId, loadHotspots]);

  if (!doc) return <div className="p-20 text-center">Loading document...</div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left: Document View */}
      <div className="flex-1 overflow-y-auto border-r border-border custom-scrollbar">
        <PDFViewer file={doc.file} />
      </div>

      {/* Right: Doubt Graph Panel */}
      <div className="w-[500px] flex-shrink-0 bg-slate-50 dark:bg-slate-900/30">
        <GraphPanel docId={docId} currentPage={1} />
      </div>
    </div>
  );
}
