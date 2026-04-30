# Feature Specifications — UI/UX Details

---

## 1. Document Viewer

### Layout

```
[Previous Page N-1]  ← dimmed, scrolls into view
[Current Page N]     ← full focus, full brightness
[Next Page N+1]      ← dimmed, scrolls into view
```

### Controls

- **Navigation**: ← → arrow keys, swipe gesture (mobile)
- **URL**: `?page=N` (shareable, bookmarkable)
- **Thumbnails**: Page thumbnail strip at bottom (click to jump)
- **Zoom**: 50% – 200%, fit-to-width toggle
- **Dark mode**: PDF inversion + UI dark theme
- **Search**: Ctrl+F: full-text search within document

### Interactions

- **Select text** → floating "Ask about this" button
- **Long-press** (mobile) → context menu with AI options
- **Click node badge** on page → jump to node in graph panel

---

## 2. Doubt Graph UI

### Panel
- **Position**: Right side (collapsible on mobile)
- **Layout**: Tree visualization (top-down or radial, user choice)

### Node States

| State | Visual | Description |
|-------|--------|-------------|
| Pending | Grey, spinner | Waiting for AI response |
| Streaming | Blue, animated border | AI generating answer |
| Done/High | Green badge | High confidence (≥0.70) |
| Done/Med | Yellow badge | Medium confidence (0.40-0.69) |
| Done/Low | Orange badge | Low confidence (<0.40) |
| Error | Red badge | Failed to generate |

### Interactions

- **Click node** → expand answer below node
- **Long-press node** → "Ask follow-up" input opens
- **Swipe node left** → delete branch
- **Tap "+" on any node** → add child question
- **Breadcrumb trail** → shows path from root to selected node

### Controls

- **"New Question" button** → creates root node for current page
- **"Clear Graph"** → archive current graph, start fresh
- **"Export Graph"** → download Q&A tree as PDF or MD

---

## 3. Exam Intelligence Layer

**Access**: "Exam Mode" button in header

### Features

#### 3.1 MCQ Generator
- Select page(s) → generate N MCQs
- Instant feedback on answer
- Track score per session

#### 3.2 Key Concepts
- AI extracts 5–10 key terms per page
- Each term linkable to page location

#### 3.3 Important Sections
- AI highlights high-yield text (predicted exam-important)
- Works on current page only

#### 3.4 Summary
- 3–5 bullet point summary of current page
- One-sentence TLDR at top

---

## 4. Memory System

### Tracks

- Topics asked about (extracted from questions)
- Frequency of questions per topic
- Confidence scores per topic over time
- Pages revisited

### Shows

- **"Weak Areas" panel**: topics with low confidence
- **"Study Streak" badge**: consecutive days used
- **"Revision Suggestions"**: sorted by topic_score DESC

### Storage

- IndexedDB locally
- Optional Supabase sync (Device ID based)

---

## 5. User Settings

### AI Settings

```
┌─────────────────────────────────────────┐
│ AI Configuration                        │
├─────────────────────────────────────────┤
│ Gemini API Keys:                        │
│   Key 1: AIza...xyz [Active]  [Remove] │
│   [+ Add Key]                           │
│                                         │
│ Ollama:                                 │
│   Base URL: http://localhost:11434     │
│   Model: llama3:8b ▼                    │
│                                         │
│ Default Model:                          │
│   ○ Auto  ● Gemini  ○ Ollama           │
│                                         │
│ Answering Mode:                         │
│   ○ Strict  ● Hybrid  ○ Assist         │
└─────────────────────────────────────────┘
```

### Viewer Settings

```
┌─────────────────────────────────────────┐
│ Viewer Preferences                      │
├─────────────────────────────────────────┤
│ Default Zoom: 100% ▼                    │
│ Dark Mode: ● On  ○ Off  ○ Auto         │
│ Page Layout: ● Scroll  ○ Paginated     │
└─────────────────────────────────────────┘
```

### RAG Settings

```
┌─────────────────────────────────────────┐
│ RAG Configuration                       │
├─────────────────────────────────────────┤
│ Semantic Context: ☑ Enabled             │
│ Context Window: ● N±1  ○ N±2  ○ N±3    │
│ Per-Document Override: ☐ Enabled        │
└─────────────────────────────────────────┘
```

### Data Management

```
┌─────────────────────────────────────────┐
│ Data & Privacy                          │
├─────────────────────────────────────────┤
│ [Clear Cache for Current Document]      │
│ [Clear All IndexedDB Data]              │
│ [Export Chat/Graph History]             │
│ [Reset All Application Data]            │
└─────────────────────────────────────────┘
```

---

## 6. PWA Features

### Installation

- "Install App" prompt in header
- Works on Chrome, Edge, Android
- "Add to Home Screen" on iOS Safari

### File Handling (manifest.json)

```json
{
  "file_handlers": [
    {
      "action": "/open",
      "accept": {
        "application/pdf": [".pdf"]
      }
    },
    {
      "action": "/open",
      "accept": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"]
      }
    },
    {
      "action": "/open",
      "accept": {
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"]
      }
    },
    {
      "action": "/open",
      "accept": {
        "text/plain": [".txt", ".md"]
      }
    }
  ]
}
```

### Offline Support

- **App shell**: fully cached (service worker)
- **Model weights**: cached after first load
- **Viewer**: works offline (client-side only)
- **Chatbot**: requires internet for Gemini; offline with Ollama
- **Graph**: readable offline, new nodes require AI connection

---

## 7. Highlight-to-Ask Feature

### Flow

```
1. User selects text in document
2. Floating button appears: "Ask about this"
3. User clicks button
4. Pre-filled question: "Explain: [selected text]"
5. User can edit or submit directly
6. Node created with selected text as context hint
```

### Implementation

```javascript
document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString();
  if (selection.length > 5) {
    showFloatingButton(selection);
  }
});
```

---

## 8. Source Chunk Highlighting

### Feature

When a node answer is displayed, the source chunks used are highlighted in the document viewer.

### Visual

- **Highlight color**: Yellow (adjustable opacity)
- **Click highlight** → show chunk metadata (page, section, confidence)
- **Hover highlight** → show snippet preview

### Implementation

```javascript
// Store chunk positions during parsing
chunk.positions = [
  { page: 5, start: 120, end: 450 }
];

// On node complete, highlight chunks
highlightChunks(node.context_chunks);
```

---

## 9. Export Options

### Graph Export

**Formats**: PDF, Markdown

**Structure** (Markdown):

```markdown
# Doubt Graph — Biology Chapter 5.pdf

## Root: What is osmosis?

**Answer**: Osmosis is the movement of water...

**Confidence**: High (0.87)

### Follow-up: Why does water move?

**Answer**: Water moves due to concentration gradient...

**Confidence**: Medium (0.65)
```

### Chat History Export

**Formats**: PDF, Markdown, JSON

**Structure** (JSON):

```json
{
  "doc_name": "Biology Chapter 5.pdf",
  "export_date": "2025-01-15T10:30:00Z",
  "total_questions": 23,
  "messages": [
    {
      "role": "user",
      "content": "What is osmosis?",
      "page": 5,
      "timestamp": "2025-01-15T10:15:00Z"
    },
    {
      "role": "assistant",
      "content": "Osmosis is...",
      "confidence": 0.87,
      "model": "gemini_key_1"
    }
  ]
}
```

---

## 10. Performance Indicators

### Loading States

```
┌─────────────────────────────────────────┐
│ Document: Biology Chapter 5.pdf         │
├─────────────────────────────────────────┤
│ ● Parsing... (2/50 pages)               │
│ ● Indexing... (45%)                     │
│ ✓ Ready for questions                   │
└─────────────────────────────────────────┘
```

### Model Badge

Always visible in chatbot header:

```
[Gemini (Key 2)] [High Confidence] [412 tokens]
```

### Confidence Badge

Color-coded by level:
- 🟢 High (≥0.70)
- 🟡 Medium (0.40-0.69)
- 🟠 Low (<0.40)

---

**Next**: See `10-build-plan.md` for the 10-week development roadmap.
