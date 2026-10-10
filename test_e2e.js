
const BASE = {
  ai: 'http://localhost:8000',
  api: 'http://localhost:5000',
  web: 'http://localhost:3000',
};

const REQUIRED_PROTOCOLS = [
  'PUSHUPS-01',
  'SPRINT-100M-01',
  'SITUPS-01',
  'WALLSIT-01',
  'HIGHJUMP-01',
];

async function request(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(15000),
      headers: {
        Accept: 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    throw new Error(
      `${url} is unreachable or timed out: ${error.message}`
    );
  }

  const contentType = response.headers.get('content-type') || '';
  let data;

  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      throw new Error(`${url} returned invalid JSON`);
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null
        ? JSON.stringify(data)
        : String(data).slice(0, 300);

    throw new Error(
      `${url} returned HTTP ${response.status}: ${detail}`
    );
  }

  return { data, response };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function requireObject(value, name) {
  assert(
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value),
    `${name} must be a JSON object`
  );
  return value;
}

function requireArray(value, name) {
  assert(Array.isArray(value), `${name} must be an array`);
  return value;
}

async function runE2ETests() {
  const results = [];
  const passed = [];
  const failed = [];

  async function test(name, fn) {
    console.log(`\n${'='.repeat(55)}\n${name}`);

    try {
      await fn();
      passed.push(name);
      console.log(`PASS: ${name}`);
    } catch (error) {
      failed.push({ name, error: error.message });
      console.error(`FAIL: ${name}\n  ${error.message}`);
    }
  }

  console.log('=== KHELKHOJ FULL STACK E2E TEST SUITE ===');

  let athleteToken;
  let adminToken;

  // 1. Service health
  await test('AI and Backend Health', async () => {
    const { data: ai } = await request(`${BASE.ai}/health`);
    requireObject(ai, 'AI health response');

    console.log(
      'AI:', ai.status,
      '| Model:', ai.model ?? 'Not reported',
      '| Gemini:', ai.gemini_coaching ?? 'Not reported'
    );

    assert(ai.status === 'HEALTHY',
      `AI service is not healthy: ${ai.status}`);

    const { data: backend } = await request(
      `${BASE.api}/health`
    );
    requireObject(backend, 'Backend health response');

    console.log(
      'Backend:', backend.status,
      '| DB:', backend.database?.status ?? 'Not reported',
      '| AI:', backend.aiService?.status ?? 'Not reported'
    );

    assert(backend.status === 'UP',
      `Backend is not UP: ${backend.status}`);

    assert(
      backend.database?.status &&
      !['DOWN', 'DISCONNECTED', 'ERROR'].includes(
        String(backend.database.status).toUpperCase()
      ),
      `Database health check failed: ${backend.database?.status ?? 'missing status'
      }`
    );

    assert(
      backend.aiService?.status &&
      !['DOWN', 'DISCONNECTED', 'ERROR'].includes(
        String(backend.aiService.status).toUpperCase()
      ),
      `Backend AI dependency check failed: ${backend.aiService?.status ?? 'missing status'
      }`
    );
  });

  // 2. Required protocols
  await test('Required Protocols', async () => {
    const { data } = await request(
      `${BASE.api}/api/v1/protocols`
    );

    // Supports either a direct array or { protocols: [...] }.
    const protocols = requireArray(
      Array.isArray(data) ? data : data?.protocols,
      'Protocols response'
    );

    const codes = protocols.map(p => p?.code).filter(Boolean);

    console.log(`Found ${codes.length} protocols: ${codes.join(', ')}`);

    const missing = REQUIRED_PROTOCOLS.filter(
      code => !codes.includes(code)
    );

    assert(
      missing.length === 0,
      `Missing required protocols: ${missing.join(', ')}`
    );

    console.log('All five required protocols are available.');
  });

  // 3. Athlete login and assessments
  await test('Athlete Authentication and Assessments', async () => {
    const { data: login } = await request(
      `${BASE.api}/api/v1/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'rahul.verma@example.com',
          password: process.env.E2E_ATHLETE_PASSWORD || 'Athlete@2026',
        }),
      }
    );

    requireObject(login, 'Athlete login response');

    assert(
      typeof login.token === 'string' && login.token.length > 0,
      `Athlete login failed: ${login.message ?? 'No token returned'}`
    );

    athleteToken = login.token;

    console.log(
      'Authenticated athlete:',
      login.user?.profile?.fullName ?? login.user?.email ?? 'Unknown',
      '| Role:', login.user?.role ?? 'Not reported'
    );

    assert(login.user, 'Login response is missing user details');

    const { data } = await request(
      `${BASE.api}/api/v1/assessments/my`,
      {
        headers: { Authorization: `Bearer ${athleteToken}` },
      }
    );

    // Supports either a direct array or { assessments: [...] }.
    const assessments = requireArray(
      Array.isArray(data) ? data : data?.assessments,
      'Athlete assessments response'
    );

    console.log('Assessment count:', assessments.length);

    for (const assessment of assessments) {
      console.log(
        `- ${assessment.protocol?.name ?? 'Unknown protocol'} ` +
        `(${assessment.protocol?.code ?? 'N/A'}) | ` +
        `Score: ${assessment.result?.overallScore ?? 'N/A'} | ` +
        `Status: ${assessment.status ?? 'N/A'}`
      );
    }
  });

  // 4. SAI admin and analytics
  await test('SAI Admin Authentication and Analytics', async () => {
    const { data: login } = await request(
      `${BASE.api}/api/v1/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@sai.gov.in',
          password: process.env.E2E_ADMIN_PASSWORD || 'SaiAdmin@2026',
        }),
      }
    );

    requireObject(login, 'Admin login response');

    assert(
      typeof login.token === 'string' && login.token.length > 0,
      `Admin login failed: ${login.message ?? 'No token returned'}`
    );

    adminToken = login.token;

    console.log(
      'Authenticated admin:',
      login.user?.email ?? 'Unknown',
      '| Role:', login.user?.role ?? 'Not reported'
    );

    assert(login.user, 'Admin login response is missing user details');

    const { data } = await request(
      `${BASE.api}/api/v1/admin/analytics`,
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );

    requireObject(data, 'Analytics response');

    const summary = requireObject(
      data.summary,
      'Analytics summary'
    );

    for (const key of [
      'totalAthletes',
      'totalAssessments',
      'averageScore',
      'pendingReviews',
    ]) {
      assert(
        Number.isFinite(Number(summary[key])),
        `Analytics field "${key}" is missing or not numeric`
      );
    }

    console.log('National Pipeline Analytics:');
    console.log('Total Athletes:', summary.totalAthletes);
    console.log('Total Assessments:', summary.totalAssessments);
    console.log('Average Score:', summary.averageScore);
    console.log('Pending Reviews:', summary.pendingReviews);
  });

  // 5. Frontend routes
  await test('Frontend Route Availability', async () => {
    const pages = ['/', '/athlete', '/admin', '/login'];

    for (const page of pages) {
      const { response } = await request(
        `${BASE.web}${page}`,
        { headers: { Accept: 'text/html' } }
      );

      assert(
        (response.headers.get('content-type') || '')
          .includes('text/html'),
        `${page} did not return HTML`
      );

      console.log(`${page} -> HTTP ${response.status}`);
    }
  });

  console.log('\n=== E2E TEST SUMMARY ===');
  console.log(`Passed: ${passed.length}`);
  console.log(`Failed: ${failed.length}`);

  if (failed.length) {
    console.error('\nFailure details:');
    for (const item of failed) {
      console.error(`- ${item.name}: ${item.error}`);
    }
    process.exitCode = 1;
  } else {
    console.log('All five test groups passed.');
  }
}

runE2ETests().catch(error => {
  console.error('Fatal E2E test error:', error.message);
  process.exitCode = 1;
});
