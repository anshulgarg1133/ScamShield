import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTests() {
  console.log('========================================================');
  console.log('🧪 Running ScamShield Backend Automated Test Suite');
  console.log('   (Tuned for Divishi\'s Supabase scam_reports & known_patterns)');
  console.log('========================================================\n');

  // Dynamically import the app on test port
  process.env.PORT = '5098';
  const { default: app } = await import('../src/index.js');
  const baseUrl = 'http://localhost:5098';

  // Wait 500ms for server to bind
  await new Promise((resolve) => setTimeout(resolve, 500));

  let passed = 0;
  let total = 0;

  async function assert(testName, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${testName}:`, err.message);
    }
  }

  // 1. Health check
  await assert('GET /api/health returns 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const data = await res.json();
    if (data.status !== 'healthy') throw new Error(`Expected status 'healthy', got ${data.status}`);
  });

  // 2. Load test payloads
  const payloadData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'test-payloads.json'), 'utf-8')
  );

  // 3. Test High Risk Detection (SBI KYC)
  await assert('POST /api/analyze flags SBI KYC scam as HIGH risk with 10 signals', async () => {
    const kycCase = payloadData.test_cases[0];
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kycCase.payload),
    });

    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success) throw new Error(`Expected body.success=true`);

    const d = body.data;
    if (d.risk_level !== 'HIGH') throw new Error(`Expected HIGH risk, got ${d.risk_level}`);
    if (d.scam_probability < 70) throw new Error(`Expected high scam probability, got ${d.scam_probability}`);
    if (!d.signals || d.signals.length !== 10) throw new Error(`Expected 10 signals, got ${d.signals?.length}`);
    if (!d.summary?.en || !d.summary?.hi) throw new Error(`Missing bilingual summary`);
    if (!d.actionable_advice?.en || !d.actionable_advice?.hi) throw new Error(`Missing bilingual advice`);
  });

  // 4. Test Legitimate Bank SMS (Safe / Low Risk)
  await assert('POST /api/analyze classifies genuine bank transaction as LOW risk', async () => {
    const safeCase = payloadData.test_cases[4];
    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeCase.payload),
    });

    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    const d = body.data;
    if (d.risk_level !== 'LOW') throw new Error(`Expected LOW risk for legitimate SMS, got ${d.risk_level}`);
    if (d.is_safe_to_interact !== true) throw new Error(`Expected is_safe_to_interact=true`);
  });

  // 5. Test Screenshot Upload (Multipart Form Data)
  await assert('POST /api/analyze accepts screenshot upload via multipart/form-data', async () => {
    const formData = new FormData();
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const blob = new Blob([pngBuffer], { type: 'image/png' });
    formData.append('image', blob, 'sample_screenshot.png');
    formData.append('sender', '+91 9876543210');
    formData.append('language', 'hi');

    const res = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success) throw new Error(`Expected body.success=true`);
    if (!body.data.signals || body.data.signals.length !== 10) throw new Error(`Expected 10 signals`);
  });

  // 6. Test Community Feed (matches Divishi's scam_reports table)
  await assert('GET /api/feed returns scam_reports matching Supabase schema', async () => {
    const res = await fetch(`${baseUrl}/api/feed`);
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success || !Array.isArray(body.data)) throw new Error(`Expected array in body.data`);
    if (body.data.length === 0) throw new Error(`Expected at least 1 report in community feed`);

    // Verify Divishi's column names
    const item = body.data[0];
    if (!('scam_type' in item) || !('risk_level' in item) || !('scam_probability' in item)) {
      throw new Error(`Item missing required columns: scam_type, risk_level, scam_probability`);
    }
  });

  // 7. Test Known Patterns (matches Divishi's known_patterns table)
  await assert('GET /api/feed/patterns returns known_patterns (frequency_count & pattern_text)', async () => {
    const res = await fetch(`${baseUrl}/api/feed/patterns`);
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success || !Array.isArray(body.data)) throw new Error(`Expected array in body.data`);

    const pattern = body.data[0];
    if (!('pattern_text' in pattern) || !('frequency_count' in pattern)) {
      throw new Error(`Pattern missing pattern_text or frequency_count`);
    }
  });

  // 8. Test Threat Intelligence Stats
  await assert('GET /api/feed/stats returns aggregate metrics', async () => {
    const res = await fetch(`${baseUrl}/api/feed/stats`);
    if (res.status !== 200) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success || typeof body.data.total_scans_logged !== 'number') {
      throw new Error(`Invalid stats structure`);
    }
  });

  // 9. Test Manual Report Submission
  await assert('POST /api/feed/report logs user community report', async () => {
    const res = await fetch(`${baseUrl}/api/feed/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message_text: 'Test user report: suspicious loan app APK sent on WhatsApp',
        scam_type: 'Fake Loan App',
        risk_level: 'High',
        source: 'whatsapp',
        verdict_reason: 'Asking for 50% upfront processing fee',
      }),
    });
    if (res.status !== 201) throw new Error(`Status was ${res.status}`);
    const body = await res.json();
    if (!body.success) throw new Error(`Expected report submission success`);
  });

  console.log('\n========================================================');
  console.log(`📊 Test Summary: ${passed}/${total} passed`);
  console.log('========================================================');

  process.exit(passed === total ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
