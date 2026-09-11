import { SchemaType } from '@google/generative-ai';

/**
 * List of the 10 core fraud signals ScamShield strictly evaluates
 */
export const SCAM_SIGNALS = [
  'Urgency',
  'Authority impersonation',
  'Financial request',
  'OTP request',
  'Suspicious URL',
  'Reward bait',
  'Threat',
  'Emotional manipulation',
  'Credential request',
  'Sender mismatch',
];

/**
 * Common Indian fraud categories
 */
export const FRAUD_CATEGORIES = [
  'BANK_KYC_PHISHING',
  'ELECTRICITY_BILL_SCAM',
  'LOTTERY_REWARD_SCAM',
  'JOB_OFFER_SCAM',
  'UPI_REFUND_SCAM',
  'LOAN_APP_EXTORTION',
  'CUSTOMS_PARCEL_FRAUD',
  'IMPERSONATION',
  'LEGITIMATE_COMMUNICATION',
  'OTHER',
];

/**
 * Google Generative AI Structured Response Schema for Gemini Flash
 * Guarantees zero random paragraphs, strict typed JSON for frontend consumption.
 */
export const geminiResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    scam_probability: {
      type: SchemaType.INTEGER,
      description: 'Probability score from 0 to 100 that this message is a scam or fraudulent.',
      nullable: false,
    },
    risk_level: {
      type: SchemaType.STRING,
      description: 'Risk level: LOW (0-30), MEDIUM (31-70), or HIGH (71-100).',
      nullable: false,
    },
    category: {
      type: SchemaType.STRING,
      description: 'The type of scam or communication detected.',
      nullable: false,
    },
    summary: {
      type: SchemaType.OBJECT,
      description: 'Concise explanation in plain language explaining why it is or is not dangerous.',
      properties: {
        en: {
          type: SchemaType.STRING,
          description: 'Plain English summary explaining the verdict clearly to non-technical users.',
          nullable: false,
        },
        hi: {
          type: SchemaType.STRING,
          description: 'Hindi summary written in clear, simple Devanagari script for Tier-2/3 Indian users.',
          nullable: false,
        },
      },
      required: ['en', 'hi'],
    },
    signals: {
      type: SchemaType.ARRAY,
      description: 'Evaluation of each of the 10 cybersecurity signals.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          signal: {
            type: SchemaType.STRING,
            description: 'Name of the signal.',
            nullable: false,
          },
          detected: {
            type: SchemaType.BOOLEAN,
            description: 'Whether this signal was found in the message.',
            nullable: false,
          },
          evidence: {
            type: SchemaType.STRING,
            description: 'Direct quote or observation from the message, or "None" if not detected.',
            nullable: true,
          },
          explanation: {
            type: SchemaType.STRING,
            description: 'Why this signal represents a danger to the user.',
            nullable: true,
          },
        },
        required: ['signal', 'detected'],
      },
    },
    reasoning: {
      type: SchemaType.STRING,
      description: 'Holistic reasoning combining the detected signals into a conclusive analysis.',
      nullable: false,
    },
    actionable_advice: {
      type: SchemaType.OBJECT,
      description: 'Immediate protective actions the user must take before tapping or paying.',
      properties: {
        en: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Action items in English, e.g. "Do not click link", "Never share OTP".',
          nullable: false,
        },
        hi: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: 'Action items in Hindi, e.g. "लिंक पर क्लिक न करें", "ओटीपी साझा न करें".',
          nullable: false,
        },
      },
      required: ['en', 'hi'],
    },
    is_safe_to_interact: {
      type: SchemaType.BOOLEAN,
      description: 'True if safe/legitimate, False if user should not engage or reply.',
      nullable: false,
    },
    extracted_text: {
      type: SchemaType.STRING,
      description: 'The raw text evaluated (extracted via OCR if screenshot provided, or original input).',
      nullable: false,
    },
  },
  required: [
    'scam_probability',
    'risk_level',
    'category',
    'summary',
    'signals',
    'reasoning',
    'actionable_advice',
    'is_safe_to_interact',
    'extracted_text',
  ],
};
