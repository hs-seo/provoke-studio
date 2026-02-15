const API_URL = 'http://localhost:3001';

export interface AuthToken {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface UserProfile {
  userId: number;
  username: string;
  email: string;
  provider: string;
  hasGitHubToken: boolean;
  hasOpenAIToken: boolean;
  isConfigured: boolean;
}

export class AuthService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    this.token = localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  // Get GitHub OAuth URL
  async getGitHubAuthUrl(): Promise<string> {
    const response = await fetch(`${API_URL}/auth/github/url`);
    const data = await response.json();
    return data.url;
  }

  // Get OpenAI OAuth URL
  async getOpenAIAuthUrl(): Promise<string> {
    const response = await fetch(`${API_URL}/auth/openai/url`);
    const data = await response.json();
    return data.url;
  }

  // Exchange code for token
  async exchangeCode(code: string): Promise<AuthToken> {
    const response = await fetch(`${API_URL}/auth/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  // Get user profile
  async getUserProfile(): Promise<UserProfile> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/user`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return await response.json();
  }

  // Select AI model
  async selectModel(model: string): Promise<void> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/provider`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({ model }),
    });

    if (!response.ok) {
      throw new Error('Failed to select model');
    }
  }

  // Make AI request through backend (using GitHub Models)
  async makeAIRequest(
    prompt: string,
    context?: string,
    maxTokens?: number,
    temperature?: number
  ): Promise<{ text: string; usage?: any }> {
    if (!this.token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/api/ai/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        prompt,
        context,
        maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'AI request failed');
    }

    return await response.json();
  }

  // Logout
  logout() {
    this.clearToken();
  }
}

export const authService = new AuthService();
