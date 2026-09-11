-- ==========================================================
-- ScamShield Database Schema (Supabase / PostgreSQL)
-- Team ScamStop | BUILD WITH भारत 2.0
-- Matches Divishi's Supabase setup (scam_reports & known_patterns)
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. scam_reports table
CREATE TABLE IF NOT EXISTS scam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_text TEXT NOT NULL,
    scam_type TEXT NOT NULL DEFAULT 'None',
    risk_level TEXT NOT NULL DEFAULT 'Low', -- 'Low', 'Medium', 'High'
    scam_probability NUMERIC(4, 2) NOT NULL DEFAULT 0.00, -- 0.00 to 1.00
    language TEXT NOT NULL DEFAULT 'English',
    source TEXT NOT NULL DEFAULT 'sms', -- 'sms', 'whatsapp', 'email', 'screenshot'
    verdict_reason TEXT,
    reported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. known_patterns table (Community Knowledge Base that gets smarter over time)
CREATE TABLE IF NOT EXISTS known_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_text TEXT NOT NULL,
    scam_type TEXT NOT NULL,
    frequency_count INT4 NOT NULL DEFAULT 1,
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for high-performance feed retrieval
CREATE INDEX IF NOT EXISTS idx_scam_reports_reported_at ON scam_reports (reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_scam_reports_risk_level ON scam_reports (risk_level);
CREATE INDEX IF NOT EXISTS idx_known_patterns_frequency ON known_patterns (frequency_count DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE scam_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE known_patterns ENABLE ROW LEVEL SECURITY;

-- Allow public read & insert for hackathon demo
CREATE POLICY "Allow public read on scam_reports" ON scam_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert on scam_reports" ON scam_reports FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on known_patterns" ON known_patterns FOR SELECT USING (true);
CREATE POLICY "Allow public insert on known_patterns" ON known_patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on known_patterns" ON known_patterns FOR UPDATE USING (true) WITH CHECK (true);

-- Seed Data exactly matching Divishi's Supabase tables
INSERT INTO known_patterns (pattern_text, scam_type, frequency_count, last_seen) VALUES
('Lottery winning bank details', 'Lottery', 15, '2026-09-10 17:28:14.456'),
('KYC update urgent link', 'Fake KYC', 12, '2026-09-10 17:28:14.456'),
('Refund request via AnyDesk', 'UPI Refund', 8, '2026-09-10 17:28:14.456')
ON CONFLICT DO NOTHING;

INSERT INTO scam_reports (message_text, scam_type, risk_level, scam_probability, language, source, verdict_reason, reported_at) VALUES
('Dear Customer, your Account KYC is Pending. Click http://sbi-kyc-update.xyz to update immediately.', 'Fake KYC', 'High', 0.94, 'English', 'sms', 'Urgent tone, shortened suspicious link, fake banking KYC impersonation', '2026-09-10 17:30:59.564'),
('Congratulations! You are selected for Part-time YouTube video liking job. Earn ₹3000/day. Join t.me/official_hr', 'Fake Job', 'High', 0.89, 'English', 'whatsapp', 'Asks for upfront registration fee, unrealistic high income promise', '2026-09-10 17:30:40.539'),
('Your OTP for HDFC Bank transaction of Rs 450 is 482910. Do not share with anyone.', 'None', 'Low', 0.05, 'English', 'sms', 'Standard bank OTP format, explicitly warns never to share OTP', '2026-09-10 17:30:40.539')
ON CONFLICT DO NOTHING;
