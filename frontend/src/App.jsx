import { useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5001/api/analyze'

/* =====================================================
   BACKEND API
===================================================== */

async function sendForAnalysis({
  text,
  file,
  language = 'en',
}) {
  let response

  if (file) {
    // Screenshot OR screenshot + text
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
    // Text only
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
    throw new Error(
      `Backend error: ${response.status}`
    )
  }

  const result = await response.json()

  if (!result.success) {
    throw new Error(
      result.error || 'Analysis failed'
    )
  }

  return result.data
}


/* =====================================================
   APP
===================================================== */

function App() {
  const [message, setMessage] = useState('')
  const [image, setImage] = useState(null)

  const [screen, setScreen] = useState('home')

  const [analysisData, setAnalysisData] = useState(null)

  const [error, setError] = useState('')

  const [fileInputKey, setFileInputKey] = useState(0)

  const fileInputRef = useRef(null)


  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageUpload = (event) => {
    const file = event.target.files[0]

    if (!file) return

    // 5 MB limit
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
      setError(
        'Please enter a message or upload a screenshot.'
      )
      return
    }

    setError('')
    setScreen('scanning')

    try {
      console.log('Sending to backend...')
      console.log('Message:', message)
      console.log('Image:', image)

      const data = await sendForAnalysis({
        text: message,
        file: image,
        language: 'en',
      })

      console.log(
        'REAL BACKEND RESPONSE:',
        data
      )

      setAnalysisData(data)

      setScreen('result')
    } catch (err) {
      console.error(
        'Analysis failed:',
        err
      )

      setError(
        err.message ||
        'Unable to analyze the message.'
      )

      setScreen('home')
    }
  }


  /* =====================================================
     BACK TO HOME
  ===================================================== */

  const handleBack = () => {
    setScreen('home')
  }


  /* =====================================================
     NEW SCAN
  ===================================================== */

  const handleNewScan = () => {
    setMessage('')
    setImage(null)
    setAnalysisData(null)
    setError('')

    setFileInputKey(
      (previous) => previous + 1
    )

    setScreen('home')
  }


  /* =====================================================
     CALCULATED RESULT VALUES
  ===================================================== */

  const detectedSignals =
    analysisData?.signals?.filter(
      (signal) => signal.detected
    ) || []

  const riskProbability =
    Math.round(
      Number(
        analysisData?.scam_probability ?? 0
      )
    )

  const riskLevel =
    analysisData?.risk_level || 'UNKNOWN'

  const category =
    analysisData?.category
      ?.replace(/_/g, ' ')
      || ''


  /* =====================================================
     SCANNING SCREEN
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

            ANALYZING MESSAGE

          </div>


          <div className="scan-orb">

            <div className="orb-ring ring-one"></div>

            <div className="orb-ring ring-two"></div>

            <div className="orb-core">
              ✦
            </div>

          </div>


          <h1>
            Checking for
            <span> scam signals.</span>
          </h1>


          <p>
            ScamShield is analyzing the message
            for suspicious patterns, links,
            urgency and impersonation.
          </p>


          <div className="scan-progress">

            <div className="scan-progress-bar"></div>

          </div>


          <div className="scan-status">

            <div className="scan-status-item active">

              <span>✓</span>

              Reading message

            </div>


            <div className="scan-status-item active">

              <span>✓</span>

              Detecting patterns

            </div>


            <div className="scan-status-item">

              <span className="loading-dot"></span>

              Evaluating risk

            </div>

          </div>

        </section>

      </main>
    )
  }


  /* =====================================================
     RESULT SCREEN
  ===================================================== */

  if (screen === 'result') {
    return (
      <main className="app result-app">

        <div className="ambient-glow glow-left"></div>

        <div className="ambient-glow glow-right"></div>

        <div className="background-grid"></div>


        {/* RESULT NAVBAR */}

        <nav className="navbar result-navbar">

          <button
            className="back-button"
            onClick={handleBack}
          >
            ←
            <span>
              Back to scanner
            </span>
          </button>


          <div className="brand">

            <div className="brand-name">
              Scam<span>Shield</span>
            </div>

          </div>


          <div className="result-nav-label">
            ANALYSIS COMPLETE
          </div>

        </nav>


        {/* RESULT */}

        <section className="result-section">


          {/* RESULT HEADER */}

          <div className="result-heading">

            <div className="result-success-badge">

              <span>✓</span>

              ANALYSIS COMPLETE

            </div>


            <h1>

              This message looks

              <span>
                {' '}

                {riskLevel === 'LOW'
                  ? 'safe.'
                  : riskLevel === 'MEDIUM'
                    ? 'suspicious.'
                    : 'dangerous.'
                }

              </span>

            </h1>


            <p>
              {analysisData?.summary?.en ||
                'ScamShield analyzed this message for suspicious patterns and risk signals.'
              }
            </p>


            {category && (
              <div className="result-category">
                {category}
              </div>
            )}

          </div>


          {/* MAIN RESULT GRID */}

          <div className="result-layout">


            {/* RISK CARD */}

            <div className="risk-card">

              <div className="risk-card-top">

                <span>
                  RISK ASSESSMENT
                </span>


                <div
                  className={`risk-status risk-${riskLevel.toLowerCase()}`}
                >
                  {riskLevel} RISK
                </div>

              </div>


              <div className="risk-score-area">


                <div className="risk-circle">

                  <svg
                    className="risk-svg"
                    viewBox="0 0 180 180"
                  >

                    <circle
                      cx="90"
                      cy="90"
                      r="72"
                      className="risk-track"
                    />


                    <circle
                      cx="90"
                      cy="90"
                      r="72"
                      className={`risk-progress risk-progress-${riskLevel.toLowerCase()}`}
                      style={{
                        strokeDashoffset:
                          452 -
                          (452 *
                            riskProbability) /
                            100,
                      }}
                    />

                  </svg>


                  <div className="risk-number">

                    <strong>
                      {riskProbability}
                    </strong>

                    <span>
                      %
                    </span>

                  </div>

                </div>


                <div className="risk-copy">

                  <div className="risk-title">

                    {riskLevel === 'LOW'
                      ? 'Low probability of a scam'
                      : riskLevel === 'MEDIUM'
                        ? 'Moderate probability of a scam'
                        : 'High probability of a scam'
                    }

                  </div>


                  <p>

                    {detectedSignals.length > 0
                      ? `We found ${detectedSignals.length} warning signal${detectedSignals.length === 1 ? '' : 's'} that require attention.`
                      : 'No major warning signals were detected.'
                    }

                  </p>

                </div>

              </div>


              {/* RISK METER */}

              <div className="risk-meter">

                <div className="meter-labels">

                  <span>
                    LOW
                  </span>

                  <span>
                    MEDIUM
                  </span>

                  <span>
                    HIGH
                  </span>

                </div>


                <div className="meter-track">

                  <div
                    className="meter-marker"
                    style={{
                      left: `${Math.min(
                        Math.max(
                          riskProbability,
                          0
                        ),
                        100
                      )}%`,
                    }}
                  ></div>

                </div>

              </div>

            </div>


            {/* DETECTED SIGNALS */}

            <div className="flags-card">

              <div className="card-heading">

                <div>

                  <div className="small-label">
                    DETECTED SIGNALS
                  </div>

                  <h2>
                    Why this is suspicious
                  </h2>

                </div>


                <div className="flag-count">

                  {detectedSignals.length
                    .toString()
                    .padStart(2, '0')}

                </div>

              </div>


              <div className="flags-list">

                {detectedSignals.length > 0 ? (

                  detectedSignals.map(
                    (signal, index) => (

                      <div
                        className="flag-item"
                        key={index}
                      >

                        <div className="flag-icon">
                          !
                        </div>


                        <div>

                          <strong>
                            {signal.signal}
                          </strong>


                          {signal.explanation && (
                            <p>
                              {signal.explanation}
                            </p>
                          )}


                          {signal.evidence && (
                            <div className="flag-evidence">
                              "{signal.evidence}"
                            </div>
                          )}

                        </div>

                      </div>

                    )
                  )

                ) : (

                  <div className="no-threats">
                    ✓ No major suspicious signals detected.
                  </div>

                )}

              </div>

            </div>

          </div>


          {/* MESSAGE ANALYZED */}

          <div className="analyzed-message-card">

            <div className="message-card-header">

              <div>

                <div className="small-label">
                  MESSAGE ANALYZED
                </div>

                <h2>
                  Original content
                </h2>

              </div>


              <div className="message-source">

                {image
                  ? 'IMAGE + TEXT'
                  : 'TEXT ANALYSIS'
                }

              </div>

            </div>


            <div className="message-content">

              {analysisData?.extracted_text
                ? analysisData.extracted_text
                : message ||
                  'Screenshot uploaded for analysis.'
              }

            </div>

          </div>


          {/* SAFETY ADVICE */}

          <div className="safety-card">

            <div className="safety-heading">

              <div className="safety-icon">
                ✓
              </div>


              <div>

                <div className="small-label">
                  WHAT YOU SHOULD DO
                </div>

                <h2>
                  Stay safe
                </h2>

              </div>

            </div>


            <div className="safety-actions">

              {analysisData?.actionable_advice?.en
                ?.map((advice, index) => (

                  <div
                    className="safety-action"
                    key={index}
                  >

                    <span>

                      {(index + 1)
                        .toString()
                        .padStart(2, '0')}

                    </span>


                    <p>
                      {advice}
                    </p>

                  </div>

                ))
              }

            </div>

          </div>


          {/* ACTION BUTTONS */}

          <div className="result-actions">

            <button
              className="new-scan-button"
              onClick={handleNewScan}
            >

              <span>
                Run another scan
              </span>

              <span>
                →
              </span>

            </button>


            <button
              className="report-button"
              type="button"
              onClick={() =>
                alert(
                  'Reporting feature will be connected soon.'
                )
              }
            >
              Report this scam
            </button>

          </div>

        </section>

      </main>
    )
  }


  /* =====================================================
     HOME SCREEN
  ===================================================== */

  return (
    <main className="app">

      {/* BACKGROUND */}

      <div className="ambient-glow glow-left"></div>

      <div className="ambient-glow glow-right"></div>

      <div className="ambient-glow glow-bottom"></div>

      <div className="background-grid"></div>


      {/* DOTS */}

      <div className="dot-pattern dots-left">

        {Array.from({ length: 25 }).map(
          (_, index) => (
            <span key={index}></span>
          )
        )}

      </div>


      <div className="dot-pattern dots-right">

        {Array.from({ length: 25 }).map(
          (_, index) => (
            <span key={index}></span>
          )
        )}

      </div>


      {/* BACKGROUND SHIELD */}

      <div className="background-shield">

        <div className="shield-inner"></div>

      </div>


      {/* NAVBAR */}

      <nav className="navbar">

        <div className="brand">

          <div className="brand-name">
            Scam<span>Shield</span>
          </div>

        </div>


        <div className="nav-links">

          <a href="#how-it-works">
            How it works
          </a>

          <a href="#about">
            About
          </a>

        </div>

      </nav>


      {/* HERO */}

      <section className="hero-section">

        <div className="hero-content">


          {/* BADGE */}

          <div className="badge">

            <span className="badge-star">
              ✦
            </span>

            <span>
              AI-POWERED SCAM DETECTION
            </span>

          </div>


          {/* HEADING */}

          <h1 className="hero-title">

            Don't just detect scams.

            <br />

            <span>
              Understand them.
            </span>

          </h1>


          {/* DESCRIPTION */}

          <p className="hero-description">

            Analyze suspicious messages before you click,
            pay or share. Get an instant risk verdict,
            understand the red flags, and know exactly
            what to do next.

          </p>


          {/* ERROR */}

          {error && (
            <div className="analysis-error">

              <strong>
                Analysis failed
              </strong>

              <span>
                {error}
              </span>

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


                <h2>
                  Is this message safe?
                </h2>


                <p>
                  Paste the message or upload a screenshot.
                </p>

              </div>


              <div className="secure-indicator">

                <span className="secure-dot"></span>

                PRIVATE ANALYSIS

              </div>

            </div>


            {/* TEXTAREA */}

            <div className="textarea-wrapper">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                placeholder="Paste a suspicious SMS, WhatsApp message, email or link here..."
                className="message-input"
              />


              <div className="textarea-hint">

                <span>
                  ✧
                </span>

                ScamShield looks for urgency,
                impersonation, suspicious links
                & other warning signals.

              </div>

            </div>


            {/* BUTTONS */}

            <div className="input-actions">


              <button
                type="button"
                className={`upload-button ${
                  image
                    ? 'uploaded'
                    : ''
                }`}
                onClick={() =>
                  fileInputRef.current.click()
                }
              >

                <span className="upload-icon">

                  {image
                    ? '✓'
                    : '↥'}

                </span>


                {image
                  ? 'Screenshot added'
                  : 'Upload screenshot'}

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
                disabled={
                  !message.trim() &&
                  !image
                }
              >

                <span>
                  Analyze message
                </span>

                <span className="arrow">
                  →
                </span>

              </button>

            </div>


            {/* FILE PREVIEW */}

            {image && (
              <div className="file-preview">

                <span>
                  ✓
                </span>

                <span>
                  {image.name}
                </span>

              </div>
            )}

          </div>


          {/* TRUST FEATURES */}

          <div className="trust-row">

            <div className="trust-item">

              <div className="trust-icon">
                ✦
              </div>

              <span>
                AI-powered analysis
              </span>

            </div>


            <div className="trust-divider"></div>


            <div className="trust-item">

              <div className="trust-icon">
                ▣
              </div>

              <span>
                Explainable results
              </span>

            </div>


            <div className="trust-divider"></div>


            <div className="trust-item">

              <div className="trust-icon">
                ϟ
              </div>

              <span>
                Actionable advice
              </span>

            </div>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section
        className="how-section"
        id="how-it-works"
      >

        <div className="how-container">


          <div className="section-heading">

            <div className="section-label">

              HOW IT WORKS

              <span></span>

            </div>


            <h2>

              From suspicious message

              <br />

              to <span>
                clear action.
              </span>

            </h2>


            <p>

              ScamShield doesn't just tell you
              something is suspicious.
              It helps you understand why.

            </p>

          </div>


          <div className="steps">


            {/* STEP 1 */}

            <div className="step-card">

              <div className="step-top">

                <div className="step-number">
                  01
                </div>

                <div className="step-icon">
                  ↥
                </div>

              </div>


              <h3>
                Paste or scan
              </h3>


              <p>
                Add a suspicious message or upload
                a screenshot for analysis.
              </p>

            </div>


            {/* STEP 2 */}

            <div className="step-card">

              <div className="step-top">

                <div className="step-number">
                  02
                </div>

                <div className="step-icon">
                  ◉
                </div>

              </div>


              <h3>
                AI analyzes
              </h3>


              <p>
                ScamShield checks the content for
                suspicious patterns and signals.
              </p>

            </div>


            {/* STEP 3 */}

            <div className="step-card">

              <div className="step-top">

                <div className="step-number">
                  03
                </div>

                <div className="step-icon">
                  ✓
                </div>

              </div>


              <h3>
                Understand & act
              </h3>


              <p>
                Get a risk verdict, clear explanation,
                and practical safety advice.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer id="about">

        <div className="footer-brand">

          <div className="footer-name">

            Scam<span>
              Shield
            </span>

          </div>


          <div className="footer-tagline">

            Think before you trust.

          </div>

        </div>


        <p>

          Built to make scam detection understandable,
          accessible & actionable.

        </p>

      </footer>

    </main>
  )
}

export default App