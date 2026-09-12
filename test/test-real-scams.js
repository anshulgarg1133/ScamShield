/**
 * ScamShield Real Example Test Runner
 * Run with: node test/test-real-scams.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5001';

const REAL_SCAM_EXAMPLES = [
  {
    category: '1. Bank KYC Phishing (SBI YONO)',
    sender: '+91 98234 11234',
    language: 'hi',
    text: 'Dear Customer, your SBI YONO NetBanking will be BLOCKED today. Please click http://sbi-kyc-update.xyz to update your PAN and Aadhaar immediately.',
  },
  {
    category: '2. Electricity Disconnection Scam (Bijli Vibhag)',
    sender: '+91 82502 12345',
    language: 'hi',
    text: 'Dear consumer your electricity power will be disconnected tonight at 9.30 pm from electricity office because your previous month bill was not updated. Immediately call officer 8250212345.',
  },
  {
    category: '3. YouTube Like / Telegram Task Scam',
    sender: '+91 70123 45678',
    language: 'en',
    text: 'Congratulations! Selected for Online Part-Time Work From Home. Earn ₹2500 - ₹5000 daily by liking YouTube videos. Join official HR on Telegram: t.me/official_hr_jobs',
  },
  {
    category: '4. KBC Lottery Winner WhatsApp Scam',
    sender: '+92 300 1234567',
    language: 'hi',
    text: 'Namaskar! Main KBC Mumbai se bol raha hoon. Aapke WhatsApp number par ₹25 Lakh ki lottery nikli hai. Lottery claim karne ke liye turant SBI manager ko ₹12,500 tax jama karein.',
  },
  {
    category: '5. Legitimate Bank Debit Notification (Safe Test)',
    sender: 'AD-HDFCBK',
    language: 'en',
    text: 'INR 450.00 debited from HDFC Bank A/c XX5678 on 11-09-26 via UPI to SWIGGY. UPI Ref 425619283741. Avail Bal: INR 18,250.00. Never share OTP with anyone.',
  },
];

async function runRealTests() {
  console.log('================================================================');
  console.log('🛡️  ScamShield Real AI Test Suite (BUILD WITH भारत 2.0)');
  console.log(`📡 Connecting to: ${BASE_URL}/api/analyze`);
  console.log('================================================================\n');

  for (const item of REAL_SCAM_EXAMPLES) {
    console.log(`\n----------------------------------------------------------------`);
    console.log(`🧪 Testing: ${item.category}`);
    console.log(`📩 Sender: ${item.sender}`);
    console.log(`💬 Message: "${item.text}"`);
    console.log(`----------------------------------------------------------------`);

    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.text,
          sender: item.sender,
          language: item.language,
          source: 'sms',
        }),
      });

      const json = await res.json();
      const elapsed = Date.now() - start;

      if (!json.success) {
        console.error(`❌ Request failed:`, json.error);
        continue;
      }

      const d = json.data;
      const riskColor =
        d.risk_level === 'HIGH' ? '🔴' : d.risk_level === 'MEDIUM' ? '🟡' : '🟢';

      console.log(`\n📊 VERDICT: ${riskColor} ${d.risk_level} RISK (Score: ${d.scam_probability}%) [${elapsed}ms]`);
      console.log(`🏷️  Category: ${d.category}`);
      console.log(`🤖 Engine: ${d.fallback_mode ? 'Heuristic Fallback' : `Gemini Flash (${d.model_used || 'Live AI'})`}`);
      console.log(`\n🇬🇧 Summary (EN):`);
      console.log(`   ${d.summary?.en}`);
      console.log(`🇮🇳 Summary (HI):`);
      console.log(`   ${d.summary?.hi}`);

      const detectedSignals = (d.signals || []).filter((s) => s.detected);
      console.log(`\n🚨 Red Flags Detected (${detectedSignals.length}/10):`);
      detectedSignals.forEach((s) => {
        console.log(`   • [${s.signal}]: "${s.evidence}"`);
        console.log(`     ↳ Reason: ${s.explanation}`);
      });

      console.log(`\n💡 Actionable Advice:`);
      (d.actionable_advice?.en || []).forEach((adv) => console.log(`   - ${adv}`));
    } catch (err) {
      console.error(`❌ Network error connecting to ${BASE_URL}:`, err.message);
    }
  }

  // Also check Community Feed
  console.log('\n================================================================');
  console.log('🗄️  Testing Community Feed (GET /api/feed)');
  console.log('================================================================');
  try {
    const feedRes = await fetch(`${BASE_URL}/api/feed?limit=3`);
    const feedJson = await feedRes.json();
    console.log(`✅ Retrieved ${feedJson.count} recent reports from threat database:`);
    (feedJson.data || []).forEach((r, i) => {
      console.log(`   ${i + 1}. [${r.scam_type || r.category}] ${r.risk_level} Risk (Prob: ${r.scam_probability})`);
      console.log(`      "${(r.message_text || '').substring(0, 70)}..."`);
    });
  } catch (err) {
    console.error('Feed fetch error:', err.message);
  }

  console.log('\n✨ All tests completed!\n');
}

runRealTests();
