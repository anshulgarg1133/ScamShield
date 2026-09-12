import { Router } from 'express';
import { config } from '../config/env.js';
import { isSupabaseConfigured } from '../config/supabase.js';

const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'ScamShield Backend',
    version: '1.0.0',
    hackathon: 'BUILD WITH भारत 2.0',
    team: 'ScamStop',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    gemini_ai: config.geminiApiKey ? 'Configured (Gemini Flash)' : 'Heuristic Fallback Mode',
    database: isSupabaseConfigured ? 'Connected (Supabase)' : 'In-Memory Intelligence Store',
  });
});

export default router;
