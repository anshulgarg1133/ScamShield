import { Router } from 'express';
import { feedController } from '../controllers/feed.controller.js';

const router = Router();

// GET /api/feed - Recent reports (from public.scam_reports)
router.get('/', feedController.getFeed);

// GET /api/feed/patterns - Community known patterns (from public.known_patterns)
router.get('/patterns', feedController.getPatterns);

// GET /api/feed/stats - Threat analytics summary
router.get('/stats', feedController.getStats);

// POST /api/feed/report - Manual report submission
router.post('/report', feedController.reportScam);

export default router;
