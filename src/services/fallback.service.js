import { SCAM_SIGNALS } from '../constants/schemas.js';

/**
 * Hackathon Resilience Engine:
 * A heuristic pattern analyzer that evaluates the exact 10 signals.
 * Used when GEMINI_API_KEY is not set, network fails, or Gemini hits 429 quota limits.
 * Guarantees zero 500 crashes during hackathon judge presentations!
 */
export function analyzeWithFallback(text, sender = 'Unknown') {
  const content = (text || '').toLowerCase();
  const rawText = text || '';

  // 1. Urgency
  const urgencyRegex = /(within\s+\d+|immediately|urgent|today|tonight|expire|24\s*hours|10\s*minutes|hurry|last\s*chance)/i;
  const urgencyMatch = rawText.match(urgencyRegex);
  const isUrgency = Boolean(urgencyMatch);

  // 2. Authority impersonation
  const authorityRegex = /(rbi|reserve\s*bank|sbi|hdfc|icici|pnb|axis|electricity\s*board|bijli|income\s*tax|police|cyber\s*cell|court|customs)/i;
  const authorityMatch = rawText.match(authorityRegex);
  const isAuthority = Boolean(authorityMatch);

  // 3. Financial request
  const financialRegex = /(pay\s*₹|transfer|deposit|₹\s*\d+|\b\d+\s*rupees|send\s*money|processing\s*fee)/i;
  const financialMatch = rawText.match(financialRegex);
  const isFinancial = Boolean(financialMatch);

  // 4. OTP request
  const otpRegex = /(otp|one\s*time\s*password|verification\s*code|share\s*code|forward\s*sms|6\s*digit)/i;
  const otpMatch = rawText.match(otpRegex);
  const isOtp = Boolean(otpMatch);

  // 5. Suspicious URL
  const urlRegex = /(https?:\/\/[^\s]+|bit\.ly[^\s]*|tinyurl[^\s]*|t\.me[^\s]*|\.xyz|\.top|\.app|\.cc|\.tk|\.live|\.buzz)/i;
  const urlMatch = rawText.match(urlRegex);
  const isUrl = Boolean(urlMatch);

  // 6. Reward bait
  const rewardRegex = /(won\s*₹|lottery|winner|kbc|cashback|free\s*gift|earn\s*₹|part\s*time\s*job|work\s*from\s*home)/i;
  const rewardMatch = rawText.match(rewardRegex);
  const isReward = Boolean(rewardMatch);

  // 7. Threat
  const threatRegex = /(blocked|suspended|deactivated|disconnect|arrest|warrant|legal\s*action|police\s*case|penalty)/i;
  const threatMatch = rawText.match(threatRegex);
  const isThreat = Boolean(threatMatch);

  // 8. Emotional manipulation
  const emotionRegex = /(emergency|hospital|accident|help\s*me|save\s*life|urgent\s*help|family\s*trouble)/i;
  const emotionMatch = rawText.match(emotionRegex);
  const isEmotion = Boolean(emotionMatch);

  // 9. Credential request
  const credentialRegex = /(password|pin|upi\s*pin|cvv|card\s*number|pan\s*card|aadhaar\s*details|netbanking)/i;
  const credentialMatch = rawText.match(credentialRegex);
  const isCredential = Boolean(credentialMatch);

  // 10. Sender mismatch
  const isMobileNumber = /(\+91|91|\b)[6-9]\d{9}\b/.test(sender || '');
  const isSenderMismatch = (isAuthority && isMobileNumber) || Boolean(sender && !/^[A-Z]{2}-[A-Z]{6}$/i.test(sender) && isAuthority);

  const signalDetails = [
    {
      signal: 'Urgency',
      detected: isUrgency,
      evidence: urgencyMatch ? urgencyMatch[0] : 'None',
      explanation: isUrgency ? 'Creates false urgency to bypass your normal critical thinking.' : 'No excessive urgency detected.',
    },
    {
      signal: 'Authority impersonation',
      detected: isAuthority,
      evidence: authorityMatch ? authorityMatch[0] : 'None',
      explanation: isAuthority ? `Claims to represent a recognized authority (${authorityMatch[0]}).` : 'No authority impersonation identified.',
    },
    {
      signal: 'Financial request',
      detected: isFinancial,
      evidence: financialMatch ? financialMatch[0] : 'None',
      explanation: isFinancial ? 'Directly solicits funds or claims pending payment.' : 'No direct financial request found.',
    },
    {
      signal: 'OTP request',
      detected: isOtp,
      evidence: otpMatch ? otpMatch[0] : 'None',
      explanation: isOtp ? 'Requests your private OTP or verification code.' : 'No OTP sharing requested.',
    },
    {
      signal: 'Suspicious URL',
      detected: isUrl,
      evidence: urlMatch ? urlMatch[0] : 'None',
      explanation: isUrl ? 'Contains a non-standard domain, URL shortener, or third-party channel.' : 'No suspicious link detected.',
    },
    {
      signal: 'Reward bait',
      detected: isReward,
      evidence: rewardMatch ? rewardMatch[0] : 'None',
      explanation: isReward ? 'Offers unrealistic cash rewards, lottery prizes, or easy earnings.' : 'No reward bait detected.',
    },
    {
      signal: 'Threat',
      detected: isThreat,
      evidence: threatMatch ? threatMatch[0] : 'None',
      explanation: isThreat ? 'Threatens severe punitive consequences (account suspension, legal arrest).' : 'No coercive threats present.',
    },
    {
      signal: 'Emotional manipulation',
      detected: isEmotion,
      evidence: emotionMatch ? emotionMatch[0] : 'None',
      explanation: isEmotion ? 'Exploits sympathy, family emergencies, or fear.' : 'No emotional manipulation detected.',
    },
    {
      signal: 'Credential request',
      detected: isCredential,
      evidence: credentialMatch ? credentialMatch[0] : 'None',
      explanation: isCredential ? 'Attempts to harvest confidential credentials (PIN, password, card).' : 'No credential harvesting detected.',
    },
    {
      signal: 'Sender mismatch',
      detected: isSenderMismatch,
      evidence: isSenderMismatch ? `Sender ${sender} does not match official bank/entity header.` : 'None',
      explanation: isSenderMismatch ? 'Official entities use registered alphabetic headers, not mobile numbers.' : 'Sender format appears standard.',
    },
  ];

  // Scoring algorithm
  const detectedCount = signalDetails.filter((s) => s.detected).length;
  let probability = Math.min(98, detectedCount * 18);
  if (isOtp && isAuthority) probability = Math.max(probability, 95);
  if (isUrl && isThreat) probability = Math.max(probability, 92);
  if (isReward && isUrl) probability = Math.max(probability, 90);
  if (detectedCount === 0) probability = 5;

  let riskLevel = 'LOW';
  if (probability > 70) riskLevel = 'HIGH';
  else if (probability > 30) riskLevel = 'MEDIUM';

  // Category determination
  let category = 'OTHER';
  if (isAuthority && (isThreat || isUrl) && (content.includes('kyc') || content.includes('bank') || content.includes('pan'))) {
    category = 'BANK_KYC_PHISHING';
  } else if (content.includes('electricity') || content.includes('bijli') || content.includes('power')) {
    category = 'ELECTRICITY_BILL_SCAM';
  } else if (isReward && (content.includes('job') || content.includes('task') || content.includes('telegram'))) {
    category = 'JOB_OFFER_SCAM';
  } else if (isReward || content.includes('lottery') || content.includes('kbc')) {
    category = 'LOTTERY_REWARD_SCAM';
  } else if (content.includes('upi') || content.includes('refund')) {
    category = 'UPI_REFUND_SCAM';
  } else if (riskLevel === 'LOW') {
    category = 'LEGITIMATE_COMMUNICATION';
  }

  const isSafe = riskLevel === 'LOW';

  const summary = {
    en: isSafe
      ? 'This message does not exhibit common cyber fraud patterns and appears to be legitimate.'
      : `High probability scam detected (${category.replace(/_/g, ' ')}). This message uses manipulative tactics to compromise your security.`,
    hi: isSafe
      ? 'इस संदेश में साइबर धोखाधड़ी के कोई सामान्य लक्षण नहीं मिले हैं और यह सुरक्षित प्रतीत होता है।'
      : `धोखाधड़ी की अत्यधिक संभावना (${category.replace(/_/g, ' ')} )। यह संदेश आपकी सुरक्षा और पैसों को खतरे में डालने के लिए बनाया गया है।`,
  };

  const actionableAdvice = {
    en: isSafe
      ? ['Verify standard details before proceeding.', 'Always safeguard your personal information.']
      : [
          'DO NOT click any link or call numbers given in the message.',
          'Never share OTP, UPI PIN, or bank passwords with anyone.',
          'Official institutions never ask for sensitive credentials over SMS or WhatsApp.',
          'If you suspect fraud, immediately call 1930 or visit cybercrime.gov.in.',
        ],
    hi: isSafe
      ? ['आगे बढ़ने से पहले सामान्य विवरण की पुष्टि कर लें।', 'अपनी व्यक्तिगत जानकारी को हमेशा सुरक्षित रखें।']
      : [
          'संदेश में दिए गए किसी भी लिंक पर क्लिक न करें और न ही उस नंबर पर कॉल करें।',
          'किसी के साथ भी अपना ओटीपी, यूपीआई पिन या बैंक पासवर्ड साझा न करें।',
          'सरकारी या बैंक अधिकारी कभी भी फोन/एसएमएस पर गोपनीय जानकारी नहीं मांगते।',
          'धोखाधड़ी की आशंका होने पर तुरंत 1930 पर कॉल करें या cybercrime.gov.in पर रिपोर्ट करें।',
        ],
  };

  return {
    scam_probability: probability,
    risk_level: riskLevel,
    category,
    summary,
    signals: signalDetails,
    reasoning: isSafe
      ? 'Analysis reveals no coercive urgency, suspicious domains, or credential harvesting signals.'
      : `Detected ${detectedCount} critical risk signals including ${signalDetails.filter((s) => s.detected).map((s) => s.signal).join(', ')}.`,
    actionable_advice: actionableAdvice,
    is_safe_to_interact: isSafe,
    extracted_text: rawText,
    fallback_mode: true,
  };
}
