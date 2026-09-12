import { createClient } from '@supabase/supabase-js';
import { config } from './env.js';

export const isSupabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

/**
 * Pre-populated in-memory store matching Divishi's exact Supabase schema:
 * Table: public.scam_reports
 */
export const memoryStore = [
  {
    id: 'c4414e13-3581-4731-9c90-e58b21377a01',
    message_text: 'Dear Customer, your Account KYC is Pending. Click http://sbi-kyc-update.xyz to update immediately.',
    scam_type: 'Fake KYC',
    risk_level: 'High',
    scam_probability: 0.94,
    language: 'English',
    source: 'sms',
    verdict_reason: 'Urgent tone, shortened suspicious link, fake banking KYC impersonation',
    reported_at: '2026-09-10T17:30:59.564Z',
  },
  {
    id: 'a5d43cea-6766-46bf-83e3-6a2ff4d8a002',
    message_text: 'Congratulations! You are selected for Part-time YouTube video liking job. Earn ₹3000/day. Join t.me/official_hr',
    scam_type: 'Fake Job',
    risk_level: 'High',
    scam_probability: 0.89,
    language: 'English',
    source: 'whatsapp',
    verdict_reason: 'Asks for upfront registration fee, unrealistic high income promise',
    reported_at: '2026-09-10T17:30:40.539Z',
  },
  {
    id: '09a26b74-64e4-4873-9b9b-08ce6540003',
    message_text: 'Your OTP for HDFC Bank transaction of Rs 450 is 482910. Do not share with anyone.',
    scam_type: 'None',
    risk_level: 'Low',
    scam_probability: 0.05,
    language: 'English',
    source: 'sms',
    verdict_reason: 'Standard bank OTP format, explicitly warns never to share OTP',
    reported_at: '2026-09-10T17:30:40.539Z',
  },
];

/**
 * Pre-populated in-memory store matching Divishi's exact Supabase schema:
 * Table: public.known_patterns
 */
export const knownPatternsStore = [
  {
    id: '4a32cf5a-5c0e-44af-8999-ee65cd250001',
    pattern_text: 'Lottery winning bank details',
    scam_type: 'Lottery',
    frequency_count: 15,
    last_seen: '2026-09-10T17:28:14.456Z',
  },
  {
    id: 'b2dc1a66-adf8-4330-acdd-83b7e19c0002',
    pattern_text: 'KYC update urgent link',
    scam_type: 'Fake KYC',
    frequency_count: 12,
    last_seen: '2026-09-10T17:28:14.456Z',
  },
  {
    id: '481dcb2a-c6ca-4769-9854-cea79f1f0003',
    pattern_text: 'Refund request via AnyDesk',
    scam_type: 'UPI Refund',
    frequency_count: 8,
    last_seen: '2026-09-10T17:28:14.456Z',
  },
];
