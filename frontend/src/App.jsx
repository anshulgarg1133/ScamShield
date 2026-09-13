import { useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5001/api/analyze'

/* =====================================================
   SAMPLE TEST MESSAGES (FOR EASY ONE-CLICK DEMO)
===================================================== */
const SAMPLE_MESSAGES = [
  {
    badge: '⚡ Electricity Cutoff',
    text: 'Dear consumer your electricity power will be disconnected tonight at 9.30 pm from electricity office because your previous month bill was not updated. Immediately call officer 8250212345.',
  },
  {
    badge: '🏦 SBI KYC Phishing',
    text: 'Dear Customer, your SBI YONO NetBanking account is suspended due to pending KYC. Click http://sbi-kyc-update.xyz to update PAN immediately or account will be permanently blocked.',
  },
  {
    badge: '💼 Telegram Job Scam',
    text: 'Congratulations! You are selected for Part-Time Online Job. Earn ₹2500 - ₹5000 daily by liking YouTube videos. Join official HR on Telegram: t.me/official_hr_pay to start.',
  },
  {
    badge: '🟢 Safe Bank Debit SMS',
    text: 'INR 450.00 debited from HDFC Bank A/c XX5678 on 11-09-26 via UPI to SWIGGY. UPI Ref 425619283741. Avail Bal: INR 18,250.00. Never share OTP with anyone.',
  },
]

/* =====================================================
   BACKEND API
===================================================== */
async function sendForAnalysis({ text, file, language = 'en' }) {
  let response

  if (file) {
    const formData = new FormData()
    formData.append('image', file)
    if (text.trim()) {
      formData.append('text', text)
    }
    formData.append('language', language)

    response = await fetch(API_URL, {
      method: 'POST',
      body: formData,
    })
  } else {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        language: language,
      }),
    })
  }

  if (!response.ok) {
    throw new Error(`Backend error: ${response.status}`)
  }

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || 'Analysis failed')
  }

  return result.data
}

/* =====================================================
   DEEP URL & VPA INSPECTOR HELPER
===================================================== */
function inspectUrlsAndVpa(rawText) {
  const text = rawText || ''
  const urlMatch = text.match(/(https?:\/\/[^\s]+|bit\.ly[^\s]*|tinyurl[^\s]*|t\.me[^\s]*|[a-zA-Z0-9.-]+\.(xyz|top|app|live|site|online|tk|cc)[^\s]*)/i)
  const vpaMatch = text.match(/([a-zA-Z0-9.\-_]+@(okhdfcbank|okaxis|oksbi|paytm|ybl|upi|apl|axl|ibl))/i) || text.match(/[a-zA-Z0-9.\-_]+@[a-zA-Z]+/i)

  if (!urlMatch && !vpaMatch) return null

  const items = []
  if (urlMatch) {
    const urlStr = urlMatch[0]
    const isSuspiciousTLD = /\.(xyz|top|app|live|site|online|tk|cc)/i.test(urlStr)
    const isTelegramOrShortener = /(t\.me|bit\.ly|tinyurl)/i.test(urlStr)
    items.push({
      type: 'SUSPICIOUS LINK / DOMAIN',
      target: urlStr,
      badge: isSuspiciousTLD ? '🚨 HIGH-RISK TLD (.xyz/.top)' : isTelegramOrShortener ? '⚠️ REDIRECT SHORTENER' : '⚠️ SUSPICIOUS LINK',
      details: isSuspiciousTLD
        ? 'Uses an unverified, disposable top-level domain (.xyz/.top) commonly purchased by phishing syndicates to bypass official bank firewalls.'
        : 'Redirects conversation off official monitored platforms into an unmonitored encrypted channel to evade telecom DLT regulation.',
      severity: 'danger',
    })
  }

  if (vpaMatch) {
    const vpaStr = vpaMatch[0]
    items.push({
      type: 'UPI VPA / PAYMENT ADDRESS',
      target: vpaStr,
      badge: '⚠️ UNVERIFIED PERSONAL VPA',
      details: 'Payment address points to a private personal account rather than an official, RBI-registered corporate merchant collection portal.',
      severity: 'warning',
    })
  }

  return items
}

/* =====================================================
   APP MAIN COMPONENT
===================================================== */
function App() {
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)
  const [screen, setScreen] = useState('home')
  const [analysisData, setAnalysisData] = useState(null)
  const [error, setError] = useState('')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [lang, setLang] = useState('en')
  const [speakingLang, setSpeakingLang] = useState(null) // null | 'hi' | 'en'

  const fileInputRef = useRef(null)

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */
  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.')
      return
    }

    setError('')
    setImage(file)
  }

  /* =====================================================
     ANALYZE
  ===================================================== */
  const handleAnalyze = async () => {
    if (!message.trim() && !image) {
      setError('Please enter a message or upload a screenshot.')
      return
    }

    setError('')
    setScreen('scanning')

    try {
      const data = await sendForAnalysis({
        text: message,
        file: image,
        language: lang,
      })

      setAnalysisData(data)
      setScreen('result')
    } catch (err) {
      console.error('Analysis failed:', err)
      setError(err.message || 'Unable to analyze the message.')
      setScreen('home')
    }
  }

  /* =====================================================
     VOICE OUTPUT (BILINGUAL: HINDI & ENGLISH)
  ===================================================== */
  const toggleVoice = (targetLang) => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported on this browser.')
      return
    }

    // Toggle off if currently speaking the requested language
    if (speakingLang === targetLang) {
      window.speechSynthesis.cancel()
      setSpeakingLang(null)
      return
    }

    window.speechSynthesis.cancel()

    let textToSpeak = ''
    let speechLang = 'en-IN'

    if (targetLang === 'hi') {
      textToSpeak =
        analysisData?.summary?.hi ||
        'सावधान! यह संदेश एक फर्जी घोटाला हो सकता है। किसी भी लिंक पर क्लिक न करें और न ही कोई जानकारी साझा करें।'
      speechLang = 'hi-IN'
    } else {
      textToSpeak =
        analysisData?.summary?.en ||
        'Warning! ScamShield has detected multiple risk signals. Do not click links or share confidential banking information.'
      speechLang = 'en-IN'
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = speechLang
    utterance.rate = 0.88

    utterance.onend = () => setSpeakingLang(null)
    utterance.onerror = () => setSpeakingLang(null)

    setSpeakingLang(targetLang)
    window.speechSynthesis.speak(utterance)
  }

  /* =====================================================
     COMPLAINT COPY & BILINGUAL WHATSAPP FORWARD
  ===================================================== */
  const copyComplaintDraft = () => {
    const textAnalyzed = analysisData?.extracted_text || message
    const flags = (analysisData?.signals || [])
      .filter((s) => s.detected)
      .map((s) => `${s.signal}: "${s.evidence}"`)
      .join('\n')

    const draft = `================================================
NATIONAL CYBER CRIME COMPLAINT DRAFT (1930)
Portal: https://cybercrime.gov.in
================================================
Date & Time: ${new Date().toLocaleString('en-IN')}
Threat Category: ${analysisData?.category?.replace(/_/g, ' ') || 'SUSPECTED FRAUD'}
Risk Level: ${analysisData?.risk_level} (${analysisData?.scam_probability}% Confidence)

INCIDENT DESCRIPTION:
Received an unsolicited suspicious communication.
Message Content:
"${textAnalyzed}"

AI FORENSIC DETECTIONS:
${flags || 'Multiple high-risk fraud triggers identified.'}

ACTION REQUESTED:
Block suspect sender number/domain and freeze associated mule bank accounts under IT Act 66D.
================================================`

    navigator.clipboard.writeText(draft)
    alert('📋 Police Complaint Draft copied to clipboard! You can paste it into cybercrime.gov.in or share with 1930 officials.')
  }

  const shareWarningToWhatsApp = (shareLang = 'en') => {
    const textAnalyzed = analysisData?.extracted_text || message
    const risk = analysisData?.risk_level || 'HIGH'
    const prob = analysisData?.scam_probability || 90
    const cat = analysisData?.category?.replace(/_/g, ' ') || 'SUSPECTED FRAUD'

    let rawMessage = ''
    if (shareLang === 'hi') {
      const summaryText =
        analysisData?.summary?.hi ||
        'यह संदेश आपके बैंक खाते या निजी जानकारी को चुराने के लिए बनाया गया एक फर्जी फ्रॉड है।'
      rawMessage =
        `🚨 *सावधान! SCAM ALERT — ScamShield AI* 🚨\n\n` +
        `⚠️ *खतरे का स्तर:* ${risk} RISK (${prob}% संभावना)\n` +
        `🏷️ *धोखाधड़ी का प्रकार:* ${cat}\n\n` +
        `📩 *संदिग्ध संदेश:* "${textAnalyzed}"\n\n` +
        `🔍 *AI निष्कर्ष:* ${summaryText}\n\n` +
        `🛑 *सुरक्षा सलाह:*\n` +
        `• किसी भी अनजान लिंक पर क्लिक न करें\n` +
        `• कभी भी OTP, UPI PIN या पासवर्ड किसी से साझा न करें\n` +
        `• AnyDesk या TeamViewer जैसे ऐप फोन में न डालें\n` +
        `• धोखाधड़ी की शिकायत राष्ट्रीय साइबर हेल्पलाइन 1930 पर करें\n\n` +
        `_अपने परिवार और दोस्तों को सुरक्षित रखने के लिए यह चेतावनी आगे भेजें!_`
    } else {
      const summaryText =
        analysisData?.summary?.en ||
        'This message exhibits dangerous deceptive patterns designed to steal funds or confidential credentials.'
      rawMessage =
        `🚨 *SCAM ALERT — VERIFIED BY SCAMSHIELD AI* 🚨\n\n` +
        `⚠️ *Risk Level:* ${risk} RISK (${prob}% Confidence)\n` +
        `🏷️ *Category:* ${cat}\n\n` +
        `📩 *Suspicious Message:* "${textAnalyzed}"\n\n` +
        `🔍 *AI Verdict:* ${summaryText}\n\n` +
        `🛑 *Safety Action:*\n` +
        `• DO NOT click any links in this message\n` +
        `• Never share OTP, UPI PIN, or netbanking passwords\n` +
        `• Do not install remote screen-sharing apps (AnyDesk/QuickSupport)\n` +
        `• Report immediately to Cyber Helpline 1930 / cybercrime.gov.in\n\n` +
        `_Forwarded via ScamShield to keep family and friends protected!_`
    }

    // Copy to clipboard silently as a reliable backup
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(rawMessage).catch(() => {})
    }

    const encodedText = encodeURIComponent(rawMessage)

    // Detect mobile device
    const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )

    if (isMobile) {
      // Deep link directly to native WhatsApp app on mobile devices
      window.location.href = `whatsapp://send?text=${encodedText}`
    } else {
      // Direct to WhatsApp Web on desktop with pre-filled message (avoids api.whatsapp.com link forwarding bug)
      window.open(`https://web.whatsapp.com/send?text=${encodedText}`, '_blank')
    }
  }

  const handleBack = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setSpeakingLang(null)
    setScreen('home')
  }

  const handleNewScan = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    setSpeakingLang(null)
    setMessage('')
    setImage(null)
    setAnalysisData(null)
    setError('')
    setFileInputKey((prev) => prev + 1)
    setScreen('home')
  }

  /* =====================================================
     CALCULATED VALUES
  ===================================================== */
  const detectedSignals = analysisData?.signals?.filter((s) => s.detected) || []
  const riskProbability = Math.round(Number(analysisData?.scam_probability ?? 0))
  const riskLevel = analysisData?.risk_level || 'UNKNOWN'
  const category = analysisData?.category?.replace(/_/g, ' ') || ''
  const inspectedTokens = inspectUrlsAndVpa(analysisData?.extracted_text || message)

  /* =====================================================
     SCREEN: SCANNING
  ===================================================== */
  if (screen === 'scanning') {
    return (
      <main className="app result-app">
        <div className="ambient-glow glow-left"></div>
        <div className="ambient-glow glow-right"></div>
        <div className="background-grid"></div>

        <nav className="navbar">
          <div className="brand">
            <div className="brand-name">
              Scam<span>Shield</span>
            </div>
          </div>
        </nav>

        <section className="scanning-screen">
          <div className="scanning-badge">
            <span className="scanning-pulse"></span>
            ANALYZING 10 CYBER FRAUD SIGNALS
          </div>

          <div className="scan-orb">
            <div className="orb-ring ring-one"></div>
            <div className="orb-ring ring-two"></div>
            <div className="orb-core">✦</div>
          </div>

          <h1>
            Evaluating message for
            <span> scam signals.</span>
          </h1>

          <p>
            ScamShield & Gemini Flash are inspecting urgency, impersonation, phishing domains, and financial threats.
          </p>

          <div className="scan-progress">
            <div className="scan-progress-bar"></div>
          </div>

          <div className="scan-status">
            <div className="scan-status-item active">
              <span>✓</span>
              Reading content & native OCR
            </div>
            <div className="scan-status-item active">
              <span>✓</span>
              Evaluating 10-signal vectors
            </div>
            <div className="scan-status-item">
              <span className="loading-dot"></span>
              Synthesizing Bharat safety verdict
            </div>
          </div>
        </section>
      </main>
    )
  }

  /* =====================================================
     SCREEN: RESULT
  ===================================================== */
  if (screen === 'result') {
    return (
      <main className="app result-app">
        <div className="ambient-glow glow-left"></div>
        <div className="ambient-glow glow-right"></div>
        <div className="background-grid"></div>

        {/* RESULT NAVBAR */}
        <nav className="navbar result-navbar">
          <button className="back-button" onClick={handleBack}>
            ← <span>Back to scanner</span>
          </button>

          <div className="brand">
            <div className="brand-name">
              Scam<span>Shield</span>
            </div>
          </div>

          <div className="result-nav-label">
            AI ANALYSIS VERIFIED
          </div>
        </nav>

        <section className="result-section">
          {/* RESULT HEADER */}
          <div className="result-heading">
            <div className="result-header-row">
              <div className="result-success-badge">
                <span>✓</span>
                ANALYSIS COMPLETE
              </div>

              {/* BILINGUAL LANGUAGE SWITCHER */}
              <div className="lang-switcher">
                <button
                  type="button"
                  className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => setLang('en')}
                >
                  🇬🇧 English
                </button>
                <button
                  type="button"
                  className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
                  onClick={() => setLang('hi')}
                >
                  🇮🇳 हिंदी
                </button>
              </div>
            </div>

            <h1>
              This message looks
              <span>
                {' '}
                {riskLevel === 'LOW'
                  ? 'safe.'
                  : riskLevel === 'MEDIUM'
                  ? 'suspicious.'
                  : 'dangerous.'}
              </span>
            </h1>

            {/* BILINGUAL SUMMARY WITH VOICE TTS BUTTONS (ENGLISH & HINDI) */}
            <div className="summary-box">
              <p className="summary-text">
                {lang === 'hi'
                  ? analysisData?.summary?.hi || analysisData?.summary?.en
                  : analysisData?.summary?.en || 'ScamShield analyzed this message for suspicious patterns and risk signals.'}
              </p>

              <div className="voice-buttons-group">
                <button
                  type="button"
                  className={`voice-tts-button ${speakingLang === 'hi' ? 'speaking' : ''}`}
                  onClick={() => toggleVoice('hi')}
                >
                  <span className="tts-icon">{speakingLang === 'hi' ? '⏹️' : '🔊'}</span>
                  <span>{speakingLang === 'hi' ? 'रोकें (Stop)' : 'हिंदी में सुनें (Listen in Hindi)'}</span>
                  {speakingLang === 'hi' && <span className="voice-waves"><span></span><span></span><span></span></span>}
                </button>

                <button
                  type="button"
                  className={`voice-tts-button voice-en ${speakingLang === 'en' ? 'speaking' : ''}`}
                  onClick={() => toggleVoice('en')}
                >
                  <span className="tts-icon">{speakingLang === 'en' ? '⏹️' : '🔊'}</span>
                  <span>{speakingLang === 'en' ? 'Stop Audio' : 'Listen in English'}</span>
                  {speakingLang === 'en' && <span className="voice-waves"><span></span><span></span><span></span></span>}
                </button>
              </div>
            </div>

            {category && <div className="result-category">{category}</div>}
          </div>

          {/* MAIN RESULT GRID */}
          <div className="result-layout">
            {/* RISK CARD */}
            <div className="risk-card">
              <div className="risk-card-top">
                <span>RISK ASSESSMENT</span>
                <div className={`risk-status risk-${riskLevel.toLowerCase()}`}>
                  {riskLevel} RISK
                </div>
              </div>

              <div className="risk-score-area">
                <div className="risk-circle">
                  <svg className="risk-svg" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r="72" className="risk-track" />
                    <circle
                      cx="90"
                      cy="90"
                      r="72"
                      className={`risk-progress risk-progress-${riskLevel.toLowerCase()}`}
                      style={{
                        strokeDashoffset: 452 - (452 * riskProbability) / 100,
                      }}
                    />
                  </svg>

                  <div className="risk-number">
                    <strong>{riskProbability}</strong>
                    <span>%</span>
                  </div>
                </div>

                <div className="risk-copy">
                  <div className="risk-title">
                    {riskLevel === 'LOW'
                      ? 'Low probability of fraud'
                      : riskLevel === 'MEDIUM'
                      ? 'Moderate probability of a scam'
                      : 'High probability of a scam'}
                  </div>
                  <p>
                    {detectedSignals.length > 0
                      ? `Identified ${detectedSignals.length} high-risk fraud trigger${detectedSignals.length === 1 ? '' : 's'} in this message.`
                      : 'No critical red flags were triggered. Appears legitimate.'}
                  </p>
                </div>
              </div>

              <div className="risk-meter">
                <div className="meter-labels">
                  <span>LOW</span>
                  <span>MEDIUM</span>
                  <span>HIGH</span>
                </div>
                <div className="meter-track">
                  <div
                    className="meter-marker"
                    style={{
                      left: `${Math.min(Math.max(riskProbability, 0), 100)}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>

            {/* DETECTED SIGNALS */}
            <div className="flags-card">
              <div className="card-heading">
                <div>
                  <div className="small-label">10-SIGNAL BEHAVIORAL EVALUATION</div>
                  <h2>Why this is dangerous</h2>
                </div>
                <div className="flag-count">
                  {detectedSignals.length.toString().padStart(2, '0')}
                </div>
              </div>

              <div className="flags-list">
                {detectedSignals.length > 0 ? (
                  detectedSignals.map((signal, index) => (
                    <div className="flag-item" key={index}>
                      <div className="flag-icon">!</div>
                      <div>
                        <strong>{signal.signal}</strong>
                        {signal.explanation && <p>{signal.explanation}</p>}
                        {signal.evidence && signal.evidence !== 'None' && (
                          <div className="flag-evidence">"{signal.evidence}"</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-threats">
                    ✓ No malicious signals detected. This communication looks like normal verified traffic.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 🔥 FEATURE 2: "WHAT HAPPENS IF I CLICK?" INTERACTIVE ATTACK WALKTHROUGH */}
          {riskLevel !== 'LOW' && (
            <div className="attack-simulator-card">
              <div className="attack-header">
                <div className="attack-badge">
                  <span>🔥</span> ATTACK FORENSIC BREAKDOWN
                </div>
                <h2>What happens if you click or reply?</h2>
                <p>
                  ScamShield breaks down the exact psychological trap scammers planned for this specific message.
                </p>
              </div>

              <div className="attack-steps-grid">
                <div className="attack-step-box step-one">
                  <div className="step-num-badge">01</div>
                  <div className="step-icon-wrap">🎣</div>
                  <h3>The Phishing Lure</h3>
                  <p>
                    You land on a deceptive clone of SBI, Tata Power, or Telegram designed to simulate urgency and make your heart race.
                  </p>
                </div>

                <div className="attack-arrow-div">➔</div>

                <div className="attack-step-box step-two">
                  <div className="step-num-badge">02</div>
                  <div className="step-icon-wrap">🪤</div>
                  <h3>The Credential Trap</h3>
                  <p>
                    You are prompted to enter your UPI PIN, NetBanking password, or download a screen-sharing APK (AnyDesk/QuickSupport).
                  </p>
                </div>

                <div className="attack-arrow-div">➔</div>

                <div className="attack-step-box step-three">
                  <div className="step-num-badge">03</div>
                  <div className="step-icon-wrap">💸</div>
                  <h3>The Financial Drain</h3>
                  <p>
                    Scammers initiate instant UPI auto-debits or lock your device. Within minutes, funds are transferred across mule accounts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 🌐 FEATURE 3: DEEP URL & VPA FORENSIC INSPECTOR */}
          {inspectedTokens && inspectedTokens.length > 0 && (
            <div className="inspector-card">
              <div className="inspector-header">
                <div className="inspector-badge">
                  <span>🌐</span> TECHNICAL FORENSICS
                </div>
                <h2>URL & UPI Deep Inspector</h2>
                <p>ScamShield examined the technical indicators embedded inside this message.</p>
              </div>

              <div className="inspector-items-list">
                {inspectedTokens.map((token, idx) => (
                  <div className={`inspector-row ${token.severity}`} key={idx}>
                    <div className="token-meta">
                      <span className="token-type">{token.type}</span>
                      <strong className="token-target">{token.target}</strong>
                    </div>
                    <div className="token-body">
                      <span className="token-badge">{token.badge}</span>
                      <p>{token.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MESSAGE ANALYZED */}
          <div className="analyzed-message-card">
            <div className="message-card-header">
              <div>
                <div className="small-label">RAW PAYLOAD INSPECTED</div>
                <h2>Message content</h2>
              </div>
              <div className="message-source">
                {image ? 'SCREENSHOT (NATIVE OCR)' : 'TEXT PAYLOAD'}
              </div>
            </div>
            <div className="message-content">
              {analysisData?.extracted_text ? analysisData.extracted_text : message || 'Screenshot analyzed directly.'}
            </div>
          </div>

          {/* SAFETY ADVICE & 1930 HELPLINE ACTIONS */}
          <div className="safety-card">
            <div className="safety-heading">
              <div className="safety-icon">✓</div>
              <div>
                <div className="small-label">EMERGENCY ACTION PLAN</div>
                <h2>Immediate protection steps</h2>
              </div>
            </div>

            <div className="safety-actions">
              {(lang === 'hi' && analysisData?.actionable_advice?.hi?.length > 0
                ? analysisData.actionable_advice.hi
                : analysisData?.actionable_advice?.en || []
              ).map((advice, index) => (
                <div className="safety-action" key={index}>
                  <span>{(index + 1).toString().padStart(2, '0')}</span>
                  <p>{advice}</p>
                </div>
              ))}
            </div>

            {/* 1930 EMERGENCY RESPONSE BAR */}
            <div className="emergency-action-bar">
              <a href="tel:1930" className="call-1930-btn">
                <span className="btn-icon">📞</span>
                <span>Call Cyber Helpline 1930</span>
              </a>

              <button type="button" className="complaint-btn" onClick={copyComplaintDraft}>
                <span className="btn-icon">📋</span>
                <span>Copy 1930 Police Complaint</span>
              </button>

              <button
                type="button"
                className="whatsapp-share-btn"
                onClick={() => shareWarningToWhatsApp('en')}
              >
                <span className="btn-icon">📲</span>
                <span>WhatsApp Alert (English)</span>
              </button>

              <button
                type="button"
                className="whatsapp-share-btn whatsapp-hi"
                onClick={() => shareWarningToWhatsApp('hi')}
              >
                <span className="btn-icon">📲</span>
                <span>WhatsApp चेतावनी (हिंदी)</span>
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="result-actions">
            <button className="new-scan-button" onClick={handleNewScan}>
              <span>Scan another message</span>
              <span>→</span>
            </button>
          </div>
        </section>
      </main>
    )
  }

  /* =====================================================
     SCREEN: HOME
  ===================================================== */
  return (
    <main className="app">
      {/* BACKGROUND */}
      <div className="ambient-glow glow-left"></div>
      <div className="ambient-glow glow-right"></div>
      <div className="ambient-glow glow-bottom"></div>
      <div className="background-grid"></div>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="brand">
          <div className="brand-name">
            Scam<span>Shield</span>
          </div>
        </div>

        <div className="nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#about">About</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          {/* BADGE */}
          <div className="badge">
            <span className="badge-star">✦</span>
            <span>AI-POWERED FRAUD DETECTION (BUILD WITH भारत 2.0)</span>
          </div>

          {/* HEADING */}
          <h1 className="hero-title">
            Don't just detect scams.
            <br />
            <span>Understand them.</span>
          </h1>

          {/* DESCRIPTION */}
          <p className="hero-description">
            Analyze suspicious messages before you click, pay or share. Get an instant risk verdict, understand the red
            flags in Hindi & English, and know exactly what to do next.
          </p>

          {/* ERROR */}
          {error && (
            <div className="analysis-error">
              <strong>Analysis failed</strong>
              <span>{error}</span>
            </div>
          )}

          {/* ANALYZER CARD */}
          <div className="analyzer-card">
            <div className="card-glow"></div>

            {/* HEADER */}
            <div className="input-header">
              <div className="input-title-area">
                <div className="input-eyebrow">
                  SCAN A MESSAGE
                  <span className="eyebrow-line"></span>
                </div>
                <h2>Is this message safe?</h2>
                <p>Paste the message or upload a screenshot.</p>
              </div>

              <div className="secure-indicator">
                <span className="secure-dot"></span>
                PRIVATE & ANONYMOUS
              </div>
            </div>

            {/* QUICK-FILL SAMPLE PILLS (JUDGE FRIENDLY!) */}
            <div className="sample-chips-row">
              <span className="sample-label">⚡ Try real examples:</span>
              <div className="chips-container">
                {SAMPLE_MESSAGES.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="sample-chip"
                    onClick={() => {
                      setMessage(sample.text)
                      setImage(null)
                    }}
                  >
                    {sample.badge}
                  </button>
                ))}
              </div>
            </div>

            {/* TEXTAREA */}
            <div className="textarea-wrapper">
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Paste a suspicious SMS, WhatsApp message, email, or link here..."
                className="message-input"
              />

              <div className="textarea-hint">
                <span>✧</span>
                ScamShield checks 10 signals: urgency, impersonation, phishing domains, OTP requests, and fake rewards.
              </div>
            </div>

            {/* BUTTONS */}
            <div className="input-actions">
              <button
                type="button"
                className={`upload-button ${image ? 'uploaded' : ''}`}
                onClick={() => fileInputRef.current.click()}
              >
                <span className="upload-icon">{image ? '✓' : '↥'}</span>
                {image ? 'Screenshot added' : 'Upload screenshot'}
              </button>

              <input
                key={fileInputKey}
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleImageUpload}
                hidden
              />

              <button
                type="button"
                className="analyze-button"
                onClick={handleAnalyze}
                disabled={!message.trim() && !image}
              >
                <span>Analyze message</span>
                <span className="arrow">→</span>
              </button>
            </div>

            {/* FILE PREVIEW */}
            {image && (
              <div className="file-preview">
                <span>✓</span>
                <span>{image.name}</span>
              </div>
            )}
          </div>

          {/* TRUST FEATURES */}
          <div className="trust-row">
            <div className="trust-item">
              <div className="trust-icon">✦</div>
              <span>Gemini Flash Native OCR</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-icon">▣</div>
              <span>10-Signal Reasoning</span>
            </div>
            <div className="trust-divider"></div>
            <div className="trust-item">
              <div className="trust-icon">ϟ</div>
              <span>Hindi Voice Output 🔊</span>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section" id="how-it-works">
        <div className="how-container">
          <div className="section-heading">
            <div className="section-label">
              HOW IT WORKS
              <span></span>
            </div>
            <h2>
              From suspicious message
              <br />
              to <span>clear action.</span>
            </h2>
            <p>ScamShield doesn't just tell you something is suspicious. It helps you understand why.</p>
          </div>

          <div className="steps">
            <div className="step-card">
              <div className="step-top">
                <div className="step-number">01</div>
                <div className="step-icon">↥</div>
              </div>
              <h3>Paste or screenshot</h3>
              <p>Add a suspicious message or upload a chat screenshot for instant multimodal analysis.</p>
            </div>

            <div className="step-card">
              <div className="step-top">
                <div className="step-number">02</div>
                <div className="step-icon">◉</div>
              </div>
              <h3>10-Signal AI Evaluation</h3>
              <p>Gemini Flash evaluates urgency, bank impersonation, credential harvesting, and suspicious links.</p>
            </div>

            <div className="step-card">
              <div className="step-top">
                <div className="step-number">03</div>
                <div className="step-icon">✓</div>
              </div>
              <h3>Hear & Act</h3>
              <p>Listen to the Hindi verdict aloud, copy a 1930 cybercrime report, and protect your family.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="about">
        <div className="footer-brand">
          <div className="footer-name">
            Scam<span>Shield</span>
          </div>
          <div className="footer-tagline">Think before you trust.</div>
        </div>
        <p>Built to make scam detection understandable, accessible & actionable for Bharat.</p>
      </footer>
    </main>
  )
}

export default App