import { supabase } from "@/integrations/supabase/client";

export interface HealthCheckResult {
  service: string;
  status: 'ok' | 'error';
  message: string;
  details?: any;
}

/**
 * Comprehensive system health check
 * Tests all critical services and edge functions
 */
export async function runSystemHealthCheck(): Promise<HealthCheckResult[]> {
  const results: HealthCheckResult[] = [];

  // 1. Check Authentication Service
  try {
    const { data, error } = await supabase.auth.getSession();
    results.push({
      service: 'Authentication',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Session check successful',
      details: { hasSession: !!data.session }
    });
  } catch (error) {
    results.push({
      service: 'Authentication',
      status: 'error',
      message: 'Failed to check authentication',
      details: error
    });
  }

  // 2. Check Database Connection
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('count')
      .limit(1);
    
    results.push({
      service: 'Database',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Database connection successful',
    });
  } catch (error) {
    results.push({
      service: 'Database',
      status: 'error',
      message: 'Failed to connect to database',
      details: error
    });
  }

  // 3. Check Chat Buddy Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('chat-buddy', {
      body: {
        messages: [
          { role: 'user', content: 'Health check test' }
        ]
      }
    });

    results.push({
      service: 'Chat Buddy Function',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Edge function responding',
      details: { error, hasData: !!data }
    });
  } catch (error) {
    results.push({
      service: 'Chat Buddy Function',
      status: 'error',
      message: 'Edge function failed',
      details: error
    });
  }

  // 4. Check Talk Buddy Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('talk-buddy-chat', {
      body: {
        message: 'Health check test'
      }
    });

    results.push({
      service: 'Talk Buddy Function',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Edge function responding',
      details: { error, hasData: !!data }
    });
  } catch (error) {
    results.push({
      service: 'Talk Buddy Function',
      status: 'error',
      message: 'Edge function failed',
      details: error
    });
  }

  // 5. Check Listen Buddy Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('listen-buddy-generate', {
      body: {
        topic: 'Health check test',
        mode: 'chat'
      }
    });

    results.push({
      service: 'Listen Buddy Function',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Edge function responding',
      details: { error, hasData: !!data }
    });
  } catch (error) {
    results.push({
      service: 'Listen Buddy Function',
      status: 'error',
      message: 'Edge function failed',
      details: error
    });
  }

  // 6. Check Read Buddy Edge Function
  try {
    const { data, error } = await supabase.functions.invoke('read-buddy-generate', {
      body: {
        topic: 'Health check test'
      }
    });

    results.push({
      service: 'Read Buddy Function',
      status: error ? 'error' : 'ok',
      message: error ? error.message : 'Edge function responding',
      details: { error, hasData: !!data }
    });
  } catch (error) {
    results.push({
      service: 'Read Buddy Function',
      status: 'error',
      message: 'Edge function failed',
      details: error
    });
  }

  return results;
}

/**
 * Get summary of health check
 */
export function getHealthSummary(results: HealthCheckResult[]) {
  const total = results.length;
  const healthy = results.filter(r => r.status === 'ok').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  return {
    total,
    healthy,
    errors,
    healthPercentage: Math.round((healthy / total) * 100),
    isHealthy: errors === 0
  };
}
