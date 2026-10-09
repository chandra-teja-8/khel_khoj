async function runE2ETests() {
  console.log('=== KHELKHOJ FULL STACK E2E TARGETED TEST SUITE ===');

  // 1. Health Checks
  console.log('\n[1/5] Checking Service Health...');
  const aiHealth = await fetch('http://localhost:8000/health').then(r => r.json());
  console.log('  AI Service:', aiHealth.status, '| Model:', aiHealth.model, '| Gemini Coaching:', aiHealth.gemini_coaching);
  if (aiHealth.status !== 'HEALTHY') throw new Error('AI Service not healthy');

  const backendHealth = await fetch('http://localhost:5000/health').then(r => r.json());
  console.log('  Backend API:', backendHealth.status, '| DB:', backendHealth.database.status, '| AI Service:', backendHealth.aiService.status);
  if (backendHealth.status !== 'UP') throw new Error('Backend API not healthy');

  // 2. Protocols (5 Tests)
  console.log('\n[2/5] Verifying 5 Mandated Protocols...');
  const protocols = await fetch('http://localhost:5000/api/v1/protocols').then(r => r.json());
  const protocolCodes = protocols.map(p => p.code);
  console.log('  Protocols found (' + protocols.length + '):', protocolCodes.join(', '));
  const expected = ['PUSHUPS-01', 'SPRINT-100M-01', 'SITUPS-01', 'WALLSIT-01', 'HIGHJUMP-01'];
  for (const exp of expected) {
    if (!protocolCodes.includes(exp)) {
      throw new Error(`Missing required protocol: ${exp}`);
    }
  }
  console.log('  --> All 5 protocols verified in database and API!');

  // 3. Athlete Auth & Assessments
  console.log('\n[3/5] Testing Athlete Authentication (Rahul Verma)...');
  const athleteLogin = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'rahul.verma@example.com', password: 'Athlete@2026' })
  }).then(r => r.json());

  if (!athleteLogin.token) throw new Error('Athlete login failed: ' + JSON.stringify(athleteLogin));
  console.log('  Logged in as:', athleteLogin.user.profile?.fullName, '| Role:', athleteLogin.user.role);

  const athleteAssessments = await fetch('http://localhost:5000/api/v1/assessments/my', {
    headers: { Authorization: `Bearer ${athleteLogin.token}` }
  }).then(r => r.json());

  console.log('  Rahul assessments count:', athleteAssessments.length);
  for (const a of athleteAssessments) {
    console.log(`    - ${a.protocol.name} (${a.protocol.code}): Score ${a.result?.overallScore || 'N/A'}, Status: ${a.status}`);
  }

  // 4. SAI Admin Auth & Analytics
  console.log('\n[4/5] Testing SAI Admin Authentication & Analytics...');
  const adminLogin = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@sai.gov.in', password: 'SaiAdmin@2026' })
  }).then(r => r.json());

  if (!adminLogin.token) throw new Error('Admin login failed: ' + JSON.stringify(adminLogin));
  console.log('  Logged in as SAI Admin:', adminLogin.user.email, '| Role:', adminLogin.user.role);

  const analytics = await fetch('http://localhost:5000/api/v1/admin/analytics', {
    headers: { Authorization: `Bearer ${adminLogin.token}` }
  }).then(r => r.json());
  console.log('  National Pipeline Analytics Summary:');
  console.log('    Total Athletes:', analytics.summary.totalAthletes);
  console.log('    Total Assessments:', analytics.summary.totalAssessments);
  console.log('    Average Score:', analytics.summary.averageScore);
  console.log('    Pending Reviews:', analytics.summary.pendingReviews);

  // 5. Frontend Pages Availability
  console.log('\n[5/5] Verifying Frontend Web App Pages...');
  const pages = ['/', '/athlete', '/admin', '/login'];
  for (const p of pages) {
    const res = await fetch(`http://localhost:3000${p}`);
    console.log(`  http://localhost:3000${p} -> HTTP ${res.status}`);
    if (res.status !== 200) throw new Error(`Frontend page ${p} returned ${res.status}`);
  }

  console.log('\n=== ALL TARGETED TESTS & CHECKS PASSED WITH 100% SUCCESS ===');
}

runE2ETests().catch(err => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});
