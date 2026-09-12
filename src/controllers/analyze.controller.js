import { analyzeScamInput } from '../services/gemini.service.js';
import { feedService } from '../services/feed.service.js';

export const analyzeController = {
  /**
   * Main analysis endpoint
   * Accepts JSON ({ text, sender, language, source }) OR Multipart Form ({ text, image file, sender, language, source })
   */
  async analyze(req, res, next) {
    try {
      const text = req.body.text ? req.body.text.trim() : '';
      const sender = req.body.sender ? req.body.sender.trim() : 'Unknown';
      const language = req.body.language ? req.body.language.trim() : 'en';
      const file = req.file;
      const source = req.body.source || (file ? 'screenshot' : 'sms');

      if (!text && !file) {
        return res.status(400).json({
          success: false,
          error: 'Please provide either a message text or upload a screenshot image to analyze.',
        });
      }

      console.log(
        `🔍 Analyzing input: ${file ? `[Screenshot: ${file.originalname}]` : `[Text: "${text.substring(0, 40)}..."]`} | Sender: ${sender} | Source: ${source}`
      );

      // Perform AI analysis with 10 signals and structured schema
      const verdict = await analyzeScamInput({
        text,
        file,
        sender,
        language,
      });

      // Automatically log to Divishi's Supabase tables (scam_reports & known_patterns)
      feedService
        .logReport({
          message_text: verdict.extracted_text || text || 'Screenshot image analysis',
          category: verdict.category,
          risk_level: verdict.risk_level,
          scam_probability: verdict.scam_probability,
          language: language.toLowerCase().includes('hi') ? 'Hindi' : 'English',
          source,
          verdict_reason: verdict.summary?.en || verdict.reasoning,
        })
        .catch((err) => console.error('Error logging detection to feed:', err));

      return res.status(200).json({
        success: true,
        data: verdict,
      });
    } catch (error) {
      next(error);
    }
  },
};
