/**
 * Enquanto as credenciais reais não estiverem configuradas (variáveis de
 * ambiente ausentes), o app cai em modo demonstração usando lib/sampleData.ts
 * — isso permite build/dev/testes funcionarem antes de o Supabase estar
 * plugado, e evita quebrar a experiência assim que as chaves forem
 * adicionadas ao ambiente de deploy.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
