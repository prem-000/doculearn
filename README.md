# 🧠 DocuLearn AI

**Understand instantly. Learn without interruption.**

DocuLearn AI is a next-generation, real-time adaptive learning engine embedded directly inside your document reading experience. Unlike generic RAG apps or chatbots, DocuLearn provides a **Thinking Layer** over your documents, allowing for non-linear exploration of complex topics through a tree-based **Doubt Graph**.

---

## ✨ Key Features

### 🌲 Doubt Graph (Non-Linear Q&A)
*   **Tree-Based Structure**: Explore doubts non-linearly with follow-up questions branching into a visual graph.
*   **Contextual Depth**: Support for up to 4 levels of depth and 5 branches per node.
*   **Node Persistence**: Every doubt and answer is saved per document session.

### 🛡️ Privacy-First Architecture
*   **Client-Side Processing**: Documents are parsed and indexed entirely in your browser.
*   **Zero Uploads**: Your raw files never leave your device.
*   **IndexedDB Storage**: Vector embeddings and chunks are stored locally in your browser's IndexedDB.

### 🚀 Advanced RAG Pipeline
*   **Hybrid Retrieval**: Combines positional search (N-1, N, N+1 pages) with semantic search for maximum relevance.
*   **Progressive Indexing**: Start asking questions immediately while the background worker continues full-text indexing.
*   **Confidence Scoring**: Real-time evaluation of AI answers based on source context.

### ⚡ AI Flexibility & Resilience
*   **Gemini Key Chaining**: Automatically rotates through multiple Google Gemini API keys to bypass rate limits.
*   **Ollama Fallback**: Seamlessly switches to your local Ollama instance if API keys are exhausted or offline.
*   **Gemini 2.5 Flash**: Optimized for speed and deep document reasoning.

### 📱 Premium Reading Experience
*   **Multi-Format Support**: PDF, DOCX, PPTX, TXT, and Markdown.
*   **Dynamic Viewer**: 3-page adaptive layout with dark mode, zoom, and highlight-to-ask functionality.
*   **PWA Ready**: Install as a desktop app with offline support and file-handler integration.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router, TypeScript) |
| **Styling** | Tailwind CSS + Framer Motion |
| **AI Models** | Google Gemini 2.5 Flash, Ollama (Fallback) |
| **Local AI** | Transformers.js (Web Worker for embeddings) |
| **Database** | Supabase (Cloud Sync) + IndexedDB (Local Storage) |
| **Parsing** | PDF.js, Mammoth.js, PPTX2JSON |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Google Gemini API Key (get one at [Google AI Studio](https://aistudio.google.com/))
- (Optional) [Ollama](https://ollama.com/) installed locally for offline fallback

### Installation
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/doculearn.git
    cd doculearn
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment Variables**:
    Create a `.env` file in the root directory (you can refer to the structure in the Settings page):
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    GEMINI_API_KEYS=key1,key2,key3
    APP_SECRET=your_custom_secret
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to see the result.

---

## 🔒 Privacy & Security

DocuLearn AI is built on the principle of **Data Sovereignty**:
- **Documents**: Stay in the browser memory/IndexedDB.
- **Embeddings**: Generated locally via Web Workers using `all-MiniLM-L6-v2`.
- **Keys**: API keys are encrypted at rest using `pgcrypto` before being stored in Supabase.
- **Anonymity**: No login required. Sessions are identified by a local `deviceId`.

---

## 📂 Project Structure

```text
doculearn/
├── docs/               # Detailed technical documentation
├── src/
│   ├── app/            # Next.js App Router (Pages & API)
│   ├── components/     # UI Components (Navbar, PDFViewer, Graph)
│   ├── hooks/          # Custom React Hooks (PWA, AI)
│   ├── lib/            # Core logic (RAG, KeyRotator, DB)
│   └── types/          # TypeScript definitions
├── public/             # Static assets & Web Workers
└── supabase/           # Migrations & Database schema
```

---

## 📄 License
This project is licensed under the MIT License.

---

**Tagline**: *"Understand instantly. Learn without interruption."*
Developed by [Your Team/Name] - 2026.
