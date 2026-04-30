import * as pdfjsLib from 'pdfjs-dist';

// Use the local worker from the public directory to avoid CORS and MIME type issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export interface DocumentChunk {
  doc_id: string;
  page_number: number;
  text: string;
  section_title?: string;
}

export async function parsePDF(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  const pages: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(pageText);
  }
  
  return pages;
}

export function chunkText(doc_id: string, pages: string[], chunkSize: number = 1000, overlap: number = 200): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  pages.forEach((pageText, index) => {
    const pageNum = index + 1;
    let start = 0;
    
    while (start < pageText.length) {
      const end = Math.min(start + chunkSize, pageText.length);
      const text = pageText.substring(start, end);
      
      chunks.push({
        doc_id,
        page_number: pageNum,
        text,
      });
      
      start += chunkSize - overlap;
      if (start >= pageText.length) break;
    }
  });
  
  return chunks;
}
