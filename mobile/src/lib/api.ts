let API_BASE_URL = 'https://your-replit-app-url.replit.app';

interface User {
  id: number;
  email: string;
  role: string;
  credits: number;
}

interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

interface GenerateResponse {
  ok: boolean;
  output?: string;
  error?: string;
  requiresLogin?: boolean;
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setApiBaseUrl(url: string) {
  API_BASE_URL = url;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error?: string; ok: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    let data: T | null = null;
    
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }
    }

    if (!response.ok) {
      const errorMessage = (data as any)?.error || `HTTP ${response.status}`;
      return { data: null, error: errorMessage, ok: false };
    }

    return { data, ok: true };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Network error', ok: false };
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const result = await apiRequest<{ ok: boolean; user?: User; token?: string; error?: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.ok && result.data?.ok && result.data.token) {
    setAuthToken(result.data.token);
    return { success: true, user: result.data.user, token: result.data.token };
  }
  
  return { success: false, error: result.error || result.data?.error || 'Login failed' };
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const result = await apiRequest<{ ok: boolean; user?: User; token?: string; error?: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (result.ok && result.data?.ok && result.data.token) {
    setAuthToken(result.data.token);
    return { success: true, user: result.data.user, token: result.data.token };
  }
  
  return { success: false, error: result.error || result.data?.error || 'Registration failed' };
}

export async function getMe(): Promise<AuthResponse> {
  const result = await apiRequest<{ ok: boolean; user?: User | null }>('/api/auth/me');

  if (result.ok && result.data?.ok && result.data.user) {
    return { success: true, user: result.data.user };
  }
  
  return { success: false, error: result.error || 'Not authenticated' };
}

export async function logout(): Promise<{ success: boolean }> {
  const result = await apiRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  setAuthToken(null);
  return { success: result.ok };
}

export interface GenerateParams {
  tool: 'cold_email' | 'proposal' | 'contract' | 'social_pack';
  inputs: Record<string, string>;
  premiumOptions?: {
    model?: string;
    length?: string;
    creativity?: number;
    customInstructions?: string;
  };
}

export async function generateContent(params: GenerateParams): Promise<{ content?: string; error?: string }> {
  const result = await apiRequest<GenerateResponse>('/api/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  if (result.ok && result.data?.ok && result.data.output) {
    return { content: result.data.output };
  }
  
  return { error: result.error || result.data?.error || 'Generation failed' };
}

export async function createCheckoutSession(credits: number, priceId: string): Promise<{ url?: string; error?: string }> {
  const result = await apiRequest<{ url?: string; error?: string }>('/api/stripe/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ credits, priceId }),
  });

  if (result.ok && result.data?.url) {
    return { url: result.data.url };
  }
  
  return { error: result.error || result.data?.error || 'Failed to create checkout session' };
}
