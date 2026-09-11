import { feedService } from '../services/feed.service.js';

export const feedController = {
  /**
   * GET /api/feed - Recent scam reports (matches public.scam_reports)
   */
  async getFeed(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const scamType = req.query.scamType || null;
      const riskLevel = req.query.riskLevel || null;

      const items = await feedService.getFeed({ limit, scamType, riskLevel });
      return res.status(200).json({
        success: true,
        count: items.length,
        data: items,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/feed/patterns - Known community scam patterns (matches public.known_patterns)
   */
  async getPatterns(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const patterns = await feedService.getKnownPatterns({ limit });
      return res.status(200).json({
        success: true,
        count: patterns.length,
        data: patterns,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/feed/stats - Threat statistics for dashboard cards
   */
  async getStats(req, res, next) {
    try {
      const stats = await feedService.getStats();
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/feed/report - Manually submit a scam report
   */
  async reportScam(req, res, next) {
    try {
      const { message_text, scam_type, risk_level, source, verdict_reason } = req.body;

      if (!message_text) {
        return res.status(400).json({
          success: false,
          error: 'message_text is required to file a report.',
        });
      }

      const report = await feedService.logReport({
        message_text,
        scam_type: scam_type || 'User Reported',
        risk_level: risk_level || 'High',
        scam_probability: 0.90,
        source: source || 'sms',
        verdict_reason: verdict_reason || 'Flagged manually by user report',
      });

      return res.status(201).json({
        success: true,
        message: 'Scam report successfully added to Supabase pattern database.',
        data: report,
      });
    } catch (error) {
      next(error);
    }
  },
};
