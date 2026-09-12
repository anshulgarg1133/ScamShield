import { supabase, isSupabaseConfigured, memoryStore, knownPatternsStore } from '../config/supabase.js';

// Map internal categories to Divishi's scam_type conventions
export function mapCategoryToScamType(category) {
  const cat = (category || '').toUpperCase();
  if (cat.includes('KYC') || cat.includes('BANK')) return 'Fake KYC';
  if (cat.includes('JOB') || cat.includes('TASK')) return 'Fake Job';
  if (cat.includes('UPI') || cat.includes('REFUND')) return 'UPI Refund';
  if (cat.includes('LOTTERY') || cat.includes('REWARD')) return 'Lottery';
  if (cat.includes('ELECTRICITY') || cat.includes('BILL')) return 'Electricity Scam';
  if (cat.includes('LOAN')) return 'Fake Loan App';
  if (cat.includes('SAFE') || cat.includes('LEGITIMATE') || cat === 'NONE') return 'None';
  return 'Phishing Scam';
}

// Convert 0-100 or 0-1 probability into decimal 0.00-1.00 for Divishi's numeric column
export function formatProbability(prob) {
  if (typeof prob !== 'number') return 0.50;
  if (prob > 1) return parseFloat((prob / 100).toFixed(2));
  return parseFloat(prob.toFixed(2));
}

// Capitalize risk level to match Divishi's table ('High', 'Medium', 'Low')
export function formatRiskLevel(risk) {
  const r = (risk || 'Low').toUpperCase();
  if (r === 'HIGH') return 'High';
  if (r === 'MEDIUM') return 'Medium';
  return 'Low';
}

export const feedService = {
  /**
   * Log a scam report matching Divishi's Supabase schema
   * Table: public.scam_reports
   */
  async logReport({
    message_text,
    scam_type,
    category,
    risk_level,
    scam_probability,
    language = 'English',
    source = 'sms',
    verdict_reason,
  }) {
    const finalScamType = scam_type || mapCategoryToScamType(category);
    const finalRiskLevel = formatRiskLevel(risk_level);
    const finalProbability = formatProbability(scam_probability);

    const payload = {
      message_text: message_text || '',
      scam_type: finalScamType,
      risk_level: finalRiskLevel,
      scam_probability: finalProbability,
      language: language.toLowerCase().includes('hi') ? 'Hindi' : 'English',
      source: source || 'sms',
      verdict_reason: verdict_reason || 'AI scam detection verdict',
    };

    // 1. Insert into Supabase scam_reports
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('scam_reports')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error('⚠️ Supabase insert failed, saving to memory fallback:', error.message);
          this.saveToMemory(payload);
        } else {
          // If scam, also update known_patterns table to get smarter
          if (finalRiskLevel === 'High' || finalRiskLevel === 'Medium') {
            await this.updateKnownPattern(finalScamType, payload.verdict_reason);
          }
          return data;
        }
      } catch (err) {
        console.error('⚠️ Supabase error:', err.message);
        this.saveToMemory(payload);
      }
    } else {
      this.saveToMemory(payload);
      if (finalRiskLevel === 'High' || finalRiskLevel === 'Medium') {
        this.updateKnownPatternMemory(finalScamType, payload.verdict_reason);
      }
    }

    return payload;
  },

  /**
   * Update or increment frequency in Divishi's known_patterns table
   */
  async updateKnownPattern(scamType, reason) {
    if (!isSupabaseConfigured || !supabase) {
      return this.updateKnownPatternMemory(scamType, reason);
    }

    try {
      // Find existing pattern with same scam_type
      const { data: existing } = await supabase
        .from('known_patterns')
        .select('*')
        .eq('scam_type', scamType)
        .limit(1);

      if (existing && existing.length > 0) {
        const item = existing[0];
        await supabase
          .from('known_patterns')
          .update({
            frequency_count: item.frequency_count + 1,
            last_seen: new Date().toISOString(),
          })
          .eq('id', item.id);
      } else {
        await supabase.from('known_patterns').insert([
          {
            pattern_text: reason ? reason.substring(0, 50) : `${scamType} pattern`,
            scam_type: scamType,
            frequency_count: 1,
            last_seen: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.warn('⚠️ Could not update known_patterns in Supabase:', err.message);
    }
  },

  updateKnownPatternMemory(scamType, reason) {
    const existing = knownPatternsStore.find((p) => p.scam_type === scamType);
    if (existing) {
      existing.frequency_count += 1;
      existing.last_seen = new Date().toISOString();
    } else {
      knownPatternsStore.push({
        id: `pat-${Date.now()}`,
        pattern_text: reason ? reason.substring(0, 50) : `${scamType} pattern`,
        scam_type: scamType,
        frequency_count: 1,
        last_seen: new Date().toISOString(),
      });
    }
  },

  /**
   * Memory fallback for scam_reports
   */
  saveToMemory(payload) {
    const record = {
      id: `rep-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      reported_at: new Date().toISOString(),
      ...payload,
    };
    memoryStore.unshift(record);
    return record;
  },

  /**
   * GET /api/feed - Fetch recent scam reports
   */
  async getFeed({ limit = 20, scamType = null, riskLevel = null } = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        let query = supabase
          .from('scam_reports')
          .select('*')
          .order('reported_at', { ascending: false })
          .limit(limit);

        if (scamType) {
          query = query.eq('scam_type', scamType);
        }
        if (riskLevel) {
          query = query.eq('risk_level', formatRiskLevel(riskLevel));
        }

        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('⚠️ Supabase getFeed error:', err.message);
      }
    }

    let results = [...memoryStore];
    if (scamType) {
      results = results.filter((r) => r.scam_type === scamType);
    }
    if (riskLevel) {
      const formatted = formatRiskLevel(riskLevel);
      results = results.filter((r) => r.risk_level === formatted);
    }
    return results.slice(0, limit);
  },

  /**
   * GET /api/feed/patterns - Fetch Divishi's known_patterns table
   */
  async getKnownPatterns({ limit = 20 } = {}) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('known_patterns')
          .select('*')
          .order('frequency_count', { ascending: false })
          .limit(limit);

        if (!error && data) return data;
      } catch (err) {
        console.warn('⚠️ Supabase getKnownPatterns error:', err.message);
      }
    }

    return [...knownPatternsStore]
      .sort((a, b) => b.frequency_count - a.frequency_count)
      .slice(0, limit);
  },

  /**
   * GET /api/feed/stats - Aggregate threat intelligence metrics
   */
  async getStats() {
    const feed = await this.getFeed({ limit: 100 });
    const patterns = await this.getKnownPatterns({ limit: 10 });
    const totalScans = feed.length;
    const scamsCount = feed.filter((r) => r.risk_level === 'High' || r.risk_level === 'Medium').length;

    const scamTypeBreakdown = {};
    feed.forEach((item) => {
      const type = item.scam_type || 'Other';
      scamTypeBreakdown[type] = (scamTypeBreakdown[type] || 0) + 1;
    });

    return {
      total_scans_logged: totalScans,
      scams_flagged_count: scamsCount,
      scam_detection_rate_pct: totalScans > 0 ? Math.round((scamsCount / totalScans) * 100) : 0,
      scam_type_breakdown: scamTypeBreakdown,
      top_known_patterns: patterns,
      dataSource: isSupabaseConfigured ? 'Supabase (Production)' : 'In-Memory Intelligence Store',
    };
  },
};
