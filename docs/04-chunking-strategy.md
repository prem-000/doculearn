# Chunking Strategy — Deep Dive

---

## 1. Chunk Size Targets

| Format | Parser | Target Tokens | Max Tokens | Strategy |
|--------|--------|---------------|------------|----------|
| PDF (text-heavy) | pdf.js | 300–400 | 512 | Page-first, paragraph split |
| PDF (figures/tables) | pdf.js | 1 page | 800 | Keep table rows together |
| DOCX | mammoth.js | 400–500 | 600 | Heading-bounded sections |
| PPTX | pptx2json | 1 slide | 400 | Slide title + body together |
| TXT / MD | Native JS | 300–400 | 512 | Paragraph-bounded windows |
| Images | Gemini Vision | N/A | N/A | Full image to Vision API |

---

## 2. Chunking Algorithm

```
ALGORITHM: ChunkDocument

INPUT: parsed_pages[], format

for each page in parsed_pages:

  STEP 1 — Detect structure
    headings = extract_headings(page)
    tables   = extract_tables(page)
    figures  = extract_figures(page)
    formulas = extract_formulas(page)
    body     = remaining_text(page)

  STEP 2 — Split body text
    paragraphs = split_by_paragraph(body)
    chunks = sliding_window(paragraphs, max_tokens=512, overlap=80)

  STEP 3 — Special chunk types
    for each table: create_table_chunk(table, page)
    for each figure: create_figure_chunk(figure.caption, page)
    for each formula: create_formula_chunk(formula, context, page)

  STEP 4 — Assign metadata
    for each chunk:
      chunk.section_title = nearest_heading_above(chunk)
      chunk.page_number   = page.number
      chunk.doc_id        = doc_id
      chunk.chunk_id      = uuid()
      chunk.token_count   = count_tokens(chunk.text)

OUTPUT: chunks[] with full metadata
```

---

## 3. Overlap Strategy

```
Chunk 1: [....paragraph A text.... | last 2 sentences of A]
Chunk 2: [last 2 sentences of A   | ....paragraph B text....]
Chunk 3: [last 2 sentences of B   | ....paragraph C text....]
```

- **Overlap window**: 50–80 tokens (1–2 sentences)
- **Purpose**: Prevent answers being split across chunk boundaries

---

## 4. Special Chunk Types

### 4.1 Table Chunks

**Structure**:
- Table title (always included)
- Column headers (always included, even in later chunks)
- Pipe-delimited rows: `| Col1 | Col2 | Col3 |`
- If table > 512 tokens: split by row groups, repeat headers

### 4.2 Figure Chunks

**Structure**:
- Caption text as chunk content
- flag: `has_image = true`
- `image_ref` = reference to image in memory
- When retrieved: image sent to Gemini Vision alongside caption

### 4.3 Formula/Math Chunks

```
ALGORITHM: MathDetection

if latex_pattern_found(text) OR equation_density > 0.3:
  route to math_pipeline:
    - Never split mid-formula
    - Include 2 sentences before formula (context)
    - Include 2 sentences after formula (result/explanation)
    - Flag chunk: is_math = true
```

### 4.4 Heading Chunks

Headings are **NOT** separate chunks. They are:
- Stored as `section_title` metadata on body chunks
- Used as section boundaries for hierarchical retrieval
- Indexed separately for section-level search

---

## 5. Selective Embedding Priority

```
ALGORITHM: EmbeddingPriority

Priority Score = (heading_weight × 3.0)
              + (keyword_density × 2.0)
              + (position_weight × 1.0)
              + (formula_weight × 2.5)

Embed order: highest priority score first

heading_weight   = 1 if chunk contains H1/H2/H3, else 0
keyword_density  = count(important_words) / total_words
position_weight  = 1.0 if chunk within ±3 pages of current, else 0.3
formula_weight   = 1 if is_math chunk, else 0
```

---

## 6. Document Processing by Format

### 6.1 PDF

```
pdf.js → getPage(N) → getTextContent() → items[].str
       → renderPage() → canvas (for image fallback)
       → For each page: extract text + render canvas
```

### 6.2 DOCX

```
mammoth.js → convertToHtml({ arrayBuffer })
           → parse HTML → extract by heading tags
           → split into heading-bounded sections
           → flatten to page-equivalent chunks
```

### 6.3 PPTX

```
pptx2json → parse slides[]
          → each slide → title + body + notes
          → one chunk per slide
          → slide number = page_number
```

### 6.4 TXT / MD

```
FileReader → readAsText()
           → split by \n\n (paragraph breaks)
           → sliding window chunking
           → MD: strip markdown syntax for embedding, keep for display
```

### 6.5 Images (JPG/PNG)

```
FileReader → readAsDataURL()
           → send to Gemini Vision for text extraction
           → extracted text → chunk as single page
```

---

## 7. Unified Page Model

All formats are normalized to the same internal structure:

```json
{
  "page_number": "int",
  "format": "pdf | docx | pptx | txt | markdown | image",
  "text": "string (for embedding)",
  "html": "string (for display)",
  "has_images": "boolean",
  "image_data": "base64 | null",
  "has_tables": "boolean",
  "has_formulas": "boolean",
  "headings": ["string"],
  "word_count": "int",
  "token_estimate": "int"
}
```

---

**Next**: See `05-web-worker-embedding.md` for the embedding pipeline.
