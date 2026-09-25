# ResearchLens 🔬

> **ChatGPT gives you an answer. ResearchLens helps you understand the evidence landscape behind the answer.**

ResearchLens is an **evidence-first AI research workspace** designed for students, academic researchers, and knowledge workers. Rather than acting as a generic conversational chatbot or generating unsupported text, ResearchLens anchors all analysis directly in real scholarly publications and uploaded documents.

---

## 🧭 Core Workflow: The Evidence Pipeline

```
Research Question → Discover Sources → Save Sources → Process Documents → Extract Evidence
         ↓
Ask Questions → Compare Studies → Detect Agreement/Disagreements → Identify Gaps → Build Literature Review
```

---

## 🚀 Key Features

1. **Authentication & Multi-Tenant Isolation**
   - Secure registration, password hashing (`bcrypt`), JWT token authentication, and session restoration.
   - Strict workspace-level data isolation: cross-tenant access attempts return `404 / 403`.

2. **Research Workspaces**
   - Create, edit, search, and archive dedicated workspaces with specific research questions, descriptions, keywords, and preferred source types.

3. **Scholarly Discovery (OpenAlex & Crossref)**
   - Query millions of academic papers in real time via the OpenAlex REST API with inverted-index abstract reconstruction.
   - Filter by year, sort order, and open-access status; save discovered papers directly to your workspace.

4. **Robust PDF Processing Pipeline**
   - High-fidelity PDF text extraction powered by Mozilla's PDF.js (`unpdf`), supporting modern object streams and complex cross-reference tables.
   - Dynamic sliding-window text chunking with page and section tracking.

5. **AI Paper Analysis (Gemini + Zod Validation)**
   - Server-side integration with `@google/genai` enforcing strict evidence grounding.
   - Extracts structured methodology, sample sizes, main findings, limitations, future directions, and key concepts.
   - Missing information is strictly tagged as `"Not found in the available document"` — zero hallucinations.

6. **Source-Grounded Q&A**
   - Ask arbitrary questions against your workspace corpus.
   - Distinguishes **Source-Supported Evidence**, **AI Interpretation**, and explicitly notes **Missing Evidence**.

7. **Side-by-Side Paper Comparison**
   - Multi-paper comparative matrix across standardized criteria (Methodology, Dataset/Sample, Key Findings, Limitations, Future Directions).

8. **Agreement & Potential Disagreement Analysis**
   - Highlights consensus across studies while detecting contextual nuances and potential disagreements (accounting for population, measurement, geography, and timeframe variations).

9. **Research Gap Finder**
   - Uncovers overlooked populations, geographic biases, methodological limitations, and conflicting findings.
   - Every identified gap is tied to contributing workspace sources.

10. **Research Relationship Graph & Timeline**
    - Interactive force-directed network visualizing verified relationships between papers, authors, and conceptual topics.
    - Chronological publication timeline charting literature growth over time.

11. **Structured Notes & Annotations**
    - Contextual note-taking linked directly to specific workspaces, papers, documents, or evidence snippets.

12. **8-Section Literature Review Builder**
    - Generates editable, source-attributed outlines covering Introduction, Background, Existing Research, Agreement, Conflicting Findings, Gaps, Directions, and Conclusion.

13. **Multi-Format Export Suite**
    - Export complete workspace summaries (JSON), evidence tables (CSV/Markdown), research gap reports, and literature reviews with a single click.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4, Lucide Icons, React Router v6 |
| **Backend** | Node.js, Express.js (REST API, MVC Architecture) |
| **Database** | PostgreSQL / PGlite (WASM embedded with persistent disk storage) |
| **AI Engine** | Google Gemini (`@google/genai`) with Zod schema validation & fallback |
| **PDF Extraction** | `unpdf` (Mozilla PDF.js engine) |
| **Scholarly APIs**| OpenAlex API & Crossref API |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+ (tested on Node v20/v24)
- npm or yarn

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone <repo-url>
cd Clg_Hackathon2
npm run install:all
```

### 2. Environment Configuration
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```
Key configuration parameters:
```env
PORT=5000
DATABASE_URL= # (Optional: Leave blank to use embedded PostgreSQL)
JWT_SECRET=your_secure_jwt_secret_key_here
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio # (Optional: Deterministic fallback enabled if unset)
OPENALEX_API_URL=https://api.openalex.org
FRONTEND_URL=http://localhost:5173
```

### 3. Launch Development Servers
Run the full stack concurrently:
```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend
```
- Frontend: `http://localhost:5173/`
- Backend API: `http://localhost:5000/api`

---

## 🧪 Verification & Automated Testing

ResearchLens includes an end-to-end integration test suite verifying 24 core assertions across authentication, tenant isolation, PDF chunking, Gemini schemas, graph generation, and exports.

Run the test suite:
```bash
npm test
```

Expected output:
```text
=====================================================
🧪 STARTING RESEARCHLENS FULL SYSTEM VERIFICATION 🧪
=====================================================
  ✅ PASS: Health endpoint returns online status
  ✅ PASS: User A registration generates JWT token
  ✅ PASS: User A login authenticates successfully
  ✅ PASS: Authenticated user profile restored via JWT
  ✅ PASS: Workspace created with relational metadata
  ✅ PASS: Data Isolation: User B forbidden from accessing User A workspace (404)
  ✅ PASS: Real OpenAlex search returned 3 papers
  ✅ PASS: Paper 1 saved to workspace
  ✅ PASS: Paper 2 saved to workspace
  ✅ PASS: Paper reading status updated to reading
  ✅ PASS: Custom tag assigned to paper
  ✅ PASS: PDF uploaded, text extracted, and chunks generated
  ✅ PASS: Structured AI analysis extracted methodology and findings
  ✅ PASS: AI Relevance level computed without error
  ✅ PASS: Source-grounded Q&A answered with source citations
  ✅ PASS: Side-by-side comparative matrix generated across criteria
  ✅ PASS: Agreement and potential disagreement analyzed
  ✅ PASS: AI identified potential research gaps with categories
  ✅ PASS: Research relationship network computed with verified nodes & links
  ✅ PASS: Chronological timeline generated
  ✅ PASS: Workspace note created with paper linkage
  ✅ PASS: 8-Section structured literature review outline generated
  ✅ PASS: Workspace summary export verified
  ✅ PASS: Evidence table exported to CSV
=====================================================
📊 TEST RESULTS: 24 PASSED, 0 FAILED
=====================================================
```

---

## 🔒 Security & Data Privacy
- **Zero Client-Side Credentials**: Gemini API keys, database credentials, and JWT secrets reside exclusively in backend environment variables.
- **Strict Tenant Boundary Enforcement**: Every database query scoped to workspace verifies `workspace.user_id === req.user.id`.
- **SQL Injection Prevention**: Relational queries use parameterized inputs (`$1, $2, ...`).
- **File Upload Safeguards**: MIME validation and 20MB file caps restrict inputs to genuine document formats.

---

## 📄 License
MIT License. Built for rigorous academic and scientific workflows.
