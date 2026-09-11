import dotenv from 'dotenv';

dotenv.config();

const rawSupabaseUrl = (process.env.SUPABASE_URL || '').trim();
const cleanSupabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

export const config = {
  port: process.env.PORT || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim(),
  supabaseUrl: cleanSupabaseUrl,
  supabaseAnonKey: (process.env.SUPABASE_ANON_KEY || '').trim(),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000,http://localhost:5173',
};

export function validateEnv() {
  console.log('----------------------------------------------------');
  console.log('🛡️  ScamShield Backend Initializing...');
  console.log(`📡 Environment: ${config.nodeEnv} | Port: ${config.port}`);

  if (!config.geminiApiKey) {
    console.warn(
      '⚠️  GEMINI_API_KEY is not set. The backend will use the zero-crash Heuristic Fallback engine.'
    );
  } else {
    console.log('✨ Gemini AI API Key detected.');
  }

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.warn(
      '⚠️  Supabase credentials not set. Running in-memory database store with seed data for hackathon demo.'
    );
  } else {
    console.log('🗄️  Supabase configuration detected.');
  }
  console.log('----------------------------------------------------');
}
