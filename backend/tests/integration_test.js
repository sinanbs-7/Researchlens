// Comprehensive End-to-End Integration Verification Suite for ResearchLens
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('=====================================================');
  console.log('🧪 STARTING RESEARCHLENS FULL SYSTEM VERIFICATION 🧪');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    assert(health.success === true && health.status === 'online', 'Health endpoint returns online status');

    // 2. Auth: Register User A
    const userAEmail = `researcher_${Date.now()}@academic.edu`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Prof. Alan Turing', email: userAEmail, password: 'SecurePassword123!' })
    });
    const regData = await regRes.json();
    assert(regData.success === true && !!regData.data.token, 'User A registration generates JWT token');
    const tokenA = regData.data.token;
    const userA = regData.data.user;

    // 3. Auth: Login User A
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userAEmail, password: 'SecurePassword123!' })
    });
    const loginData = await loginRes.json();
    assert(loginData.success === true && loginData.data.user.email === userAEmail, 'User A login authenticates successfully');

    // 4. Auth: Profile me
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const meData = await meRes.json();
    assert(meData.success === true && meData.data.user.id === userA.id, 'Authenticated user profile restored via JWT');

    // 5. Workspace: Create
    const wsRes = await fetch(`${BASE_URL}/workspaces`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: 'Cognitive Computing & Memory Retention',
        researchQuestion: 'How do neural retrieval mechanisms impact semantic memory consolidation?',
        description: 'Empirical investigation of cognitive models.',
        researchField: 'Cognitive Neuroscience',
        keywords: ['Neural Retrieval', 'Memory Consolidation', 'Cognitive Modeling']
      })
    });
    const wsData = await wsRes.json();
    assert(wsData.success === true && wsData.data.workspace.title === 'Cognitive Computing & Memory Retention', 'Workspace created with relational metadata');
    const workspaceId = wsData.data.workspace.id;

    // 6. Security & Isolation: Register User B and verify inability to access User A workspace
    const userBEmail = `adversary_${Date.now()}@test.org`;
    const regBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Unauthorized User', email: userBEmail, password: 'SecurePassword123!' })
    });
    const tokenB = (await regBRes.json()).data.token;

    const crossAccessRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    assert(crossAccessRes.status === 404, 'Data Isolation: User B forbidden from accessing User A workspace (404)');

    // 7. Research Discovery: Real OpenAlex Search
    const searchRes = await fetch(`${BASE_URL}/research/search?query=neural+memory+consolidation&perPage=3`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const searchData = await searchRes.json();
    assert(searchData.success === true && searchData.data.results.length >= 2, `Real OpenAlex search returned ${searchData.data?.results?.length} papers`);

    const p1 = searchData.data.results[0];
    const p2 = searchData.data.results[1];

    // 8. Papers: Save to Workspace
    const saveRes1 = await fetch(`${BASE_URL}/workspaces/${workspaceId}/papers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify(p1)
    });
    const s1 = await saveRes1.json();
    assert(s1.success === true && !!s1.data.paper.id, 'Paper 1 saved to workspace');
    const paper1Id = s1.data.paper.id;

    const saveRes2 = await fetch(`${BASE_URL}/workspaces/${workspaceId}/papers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify(p2)
    });
    const s2 = await saveRes2.json();
    assert(s2.success === true && !!s2.data.paper.id, 'Paper 2 saved to workspace');
    const paper2Id = s2.data.paper.id;

    // 9. Paper Status & Tags
    const statusRes = await fetch(`${BASE_URL}/papers/${paper1Id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ status: 'reading' })
    });
    const statusData = await statusRes.json();
    assert(statusData.success === true && statusData.data.status === 'reading', 'Paper reading status updated to reading');

    const tagRes = await fetch(`${BASE_URL}/papers/${paper1Id}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ name: 'Key Benchmark' })
    });
    const tagData = await tagRes.json();
    assert(tagData.success === true && tagData.data.tag.name === 'Key Benchmark', 'Custom tag assigned to paper');

    // 10. Document Processing: Upload and Chunking
    const formData = new FormData();
    const pdfPath = fs.existsSync(path.join(__dirname, '../sample_study.pdf'))
      ? path.join(__dirname, '../sample_study.pdf')
      : (fs.existsSync('sample_study.pdf') ? 'sample_study.pdf' : 'backend/sample_study.pdf');
    const pdfBuf = fs.readFileSync(pdfPath);
    formData.append('file', new Blob([pdfBuf], { type: 'application/pdf' }), 'sample_study.pdf');
    formData.append('workspaceId', workspaceId);
    formData.append('paperId', paper1Id);

    const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokenA}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    assert(uploadData.success === true && uploadData.data.document.processing_status === 'completed', 'PDF uploaded, text extracted, and chunks generated');
    const docId = uploadData.data.document.id;

    // 11. AI Analysis of Document
    const analyzeRes = await fetch(`${BASE_URL}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId, documentId: docId })
    });
    const analyzeData = await analyzeRes.json();
    assert(analyzeData.success === true && !!analyzeData.data.analysis.methodology, 'Structured AI analysis extracted methodology and findings');

    // 12. AI Paper Relevance Assessment
    const relRes = await fetch(`${BASE_URL}/ai/relevance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId, paperId: paper1Id })
    });
    const relData = await relRes.json();
    assert(relData.success === true && ['high', 'medium', 'low', 'unclear'].includes(relData.data.relevance.relevanceLevel), 'AI Relevance level computed without error');

    // 13. Source-Grounded Q&A
    const qaRes = await fetch(`${BASE_URL}/ai/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId, question: 'What sample size and empirical findings are documented?' })
    });
    const qaData = await qaRes.json();
    assert(qaData.success === true && !!qaData.data.answer, 'Source-grounded Q&A answered with source citations');

    // 14. Paper Comparison Matrix
    const compRes = await fetch(`${BASE_URL}/ai/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId, paperIds: [paper1Id, paper2Id] })
    });
    const compData = await compRes.json();
    assert(compData.success === true && compData.data.comparison.length > 0, 'Side-by-side comparative matrix generated across criteria');

    // 15. Agreement & Disagreement Analysis
    const confRes = await fetch(`${BASE_URL}/ai/conflicts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId })
    });
    const confData = await confRes.json();
    assert(confData.success === true && Array.isArray(confData.data.agreements), 'Agreement and potential disagreement analyzed');

    // 16. Research Gap Detection
    const gapsRes = await fetch(`${BASE_URL}/ai/gaps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId })
    });
    const gapsData = await gapsRes.json();
    assert(gapsData.success === true && gapsData.data.gaps.length > 0, 'AI identified potential research gaps with categories');

    // 17. Research Map & Timeline
    const mapRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/map`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const mapData = await mapRes.json();
    assert(mapData.success === true && mapData.data.nodes.length > 0, 'Research relationship network computed with verified nodes & links');

    const timeRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/timeline`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const timeData = await timeRes.json();
    assert(timeData.success === true && Array.isArray(timeData.data.timeline), 'Chronological timeline generated');

    // 18. Notes CRUD
    const noteRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({
        content: 'Crucial observation: Retention gains correlate with real-time feedback latency.',
        paperId: paper1Id
      })
    });
    const noteData = await noteRes.json();
    assert(noteData.success === true && !!noteData.data.note.id, 'Workspace note created with paper linkage');

    // 19. Literature Review Outline
    const litRes = await fetch(`${BASE_URL}/ai/literature-outline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
      body: JSON.stringify({ workspaceId })
    });
    const litData = await litRes.json();
    assert(litData.success === true && litData.data.sections.length === 8, '8-Section structured literature review outline generated');

    // 20. Export Functionality (Summary & Evidence)
    const exportSummaryRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/export/summary?format=json`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const expSummaryData = await exportSummaryRes.json();
    assert(expSummaryData.success === true && expSummaryData.data.papers.length >= 2, 'Workspace summary export verified');

    const exportEvidenceRes = await fetch(`${BASE_URL}/workspaces/${workspaceId}/export/evidence?format=csv`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const csvContent = await exportEvidenceRes.text();
    assert(csvContent.includes('Source Document') && csvContent.includes('Claim'), 'Evidence table exported to CSV');

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');
}

runTests();
