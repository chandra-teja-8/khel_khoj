const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api/v1';

async function main() {
  console.log('=== TESTING COMPLETE VIDEO ASSESSMENT WORKFLOW ===');

  // 1. Athlete Login
  console.log('\n1. Logging in as Athlete...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'rahul.verma@example.com',
      password: process.env.E2E_ATHLETE_PASSWORD || 'Athlete@2026',
    }),
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
  const token = loginData.token;
  console.log(`Athlete logged in: ${loginData.user.profile?.fullName} (User ID: ${loginData.user.id})`);

  // 2. Fetch Protocols
  console.log('\n2. Fetching available sports and protocols...');
  const protocolsRes = await fetch(`${BASE_URL}/protocols`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const protocolsData = await protocolsRes.json();
  const protocols = Array.isArray(protocolsData) ? protocolsData : protocolsData.protocols;
  const targetProtocol = protocols.find(p => p.code === 'SITUPS-01') || protocols[0];
  console.log(`Selected Protocol: ${targetProtocol.name} (${targetProtocol.code}), Sport ID: ${targetProtocol.sportId}`);

  // 3. Upload Video
  console.log('\n3. Uploading actual exercise video (ad29fd71-ed95-4a99-9736-0b1f5325bb25.mp4)...');
  const videoPath = path.resolve(__dirname, 'storage/videos/ad29fd71-ed95-4a99-9736-0b1f5325bb25.mp4');
  if (!fs.existsSync(videoPath)) throw new Error(`Video file not found at ${videoPath}`);

  const videoBuffer = fs.readFileSync(videoPath);
  const blob = new Blob([videoBuffer], { type: 'video/mp4' });

  const formData = new FormData();
  formData.append('video', blob, 'test_situps.mp4');
  formData.append('sportId', targetProtocol.sportId);
  formData.append('protocolId', targetProtocol.id);

  const uploadStart = Date.now();
  const uploadRes = await fetch(`${BASE_URL}/assessments/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const uploadData = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  const assessmentId = uploadData.assessment.id;
  console.log(`Uploaded in ${Date.now() - uploadStart}ms! Created Assessment ID: ${assessmentId}, Status: ${uploadData.assessment.status}`);

  // 4. Trigger Non-blocking Processing
  console.log('\n4. Triggering non-blocking /process endpoint...');
  const processStart = Date.now();
  const processRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/process`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const processData = await processRes.json();
  const processElapsed = Date.now() - processStart;
  console.log(`/process responded in ${processElapsed}ms with HTTP ${processRes.status}:`, processData);
  if (processRes.status !== 202 && processRes.status !== 200) {
    throw new Error(`Process did not return 202: ${JSON.stringify(processData)}`);
  }
  if (processElapsed > 5000) {
    throw new Error(`Process endpoint took too long (${processElapsed}ms) - should be immediate fire-and-forget!`);
  }

  // 5. Poll Status
  console.log('\n5. Polling /status endpoint until terminal state...');
  let terminalReached = false;
  let pollCount = 0;
  let finalStatus = null;

  while (!terminalReached && pollCount < 40) {
    await new Promise(r => setTimeout(r, 2000));
    pollCount++;
    const statusRes = await fetch(`${BASE_URL}/assessments/${assessmentId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const statusData = await statusRes.json();
    console.log(`Poll #${pollCount} (+${pollCount * 2}s): Status = ${statusData.status}`);

    if (['COMPLETED', 'NEEDS_RETAKE', 'FAILED'].includes(statusData.status)) {
      terminalReached = true;
      finalStatus = statusData;
    }
  }

  if (!terminalReached) {
    throw new Error('Timed out waiting for assessment to complete.');
  }

  console.log('\nFinal Assessment Status Result:');
  console.log(JSON.stringify(finalStatus, null, 2));

  // 6. SAI Admin Review check
  console.log('\n6. Checking SAI Admin assessment view...');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@sai.gov.in',
      password: process.env.E2E_ADMIN_PASSWORD || 'SaiAdmin@2026',
    }),
  });
  const adminLoginData = await adminLoginRes.json();
  const adminToken = adminLoginData.token;

  const adminAssessmentRes = await fetch(`${BASE_URL}/assessments/${assessmentId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminAssessmentData = await adminAssessmentRes.json();
  console.log(`Admin assessment query HTTP ${adminAssessmentRes.status}: Status = ${adminAssessmentData.status}`);

  const adminListRes = await fetch(`${BASE_URL}/admin/assessments`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const adminListData = await adminListRes.json();
  console.log(`Admin assessment queue contains ${adminListData.length} items`);

  console.log('\n=== TEST WORKFLOW COMPLETED SUCCESSFULLY! ===');
}

main().catch(err => {
  console.error('\nWorkflow Error:', err);
  process.exit(1);
});
