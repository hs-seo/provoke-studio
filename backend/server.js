const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const crypto = require('crypto');
const Anthropic = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:1420', 'tauri://localhost'],
  credentials: true
}));
app.use(express.json());

// JWT Secret (production에서는 환경변수로 관리)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// In-memory storage (production에서는 데이터베이스 사용)
// { userId: { githubToken: '', provider: 'github-models' } }
const userStorage = new Map();

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/auth/github/callback';

// OpenAI OAuth configuration (OpenAI Codex public client)
const OPENAI_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';  // OpenAI Codex public client ID
const OPENAI_AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const OPENAI_TOKEN_URL = 'https://auth.openai.com/oauth/token';
const OPENAI_CALLBACK_URL = process.env.OPENAI_CALLBACK_URL || 'http://localhost:1455/auth/callback';

// PKCE storage (in-memory for now)
const pkceStorage = new Map();

// PKCE helper functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

function generateState() {
  return crypto.randomBytes(16).toString('base64url');
}

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GitHub OAuth - Get authorization URL
app.get('/auth/github/url', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_CALLBACK_URL}&scope=user:email&state=${state}`;

  res.json({ url: redirectUri, state });
});

// GitHub OAuth - Callback
app.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: GITHUB_CALLBACK_URL,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token } = tokenResponse.data;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, login, email } = userResponse.data;

    // Create JWT token with GitHub access token
    const jwtToken = jwt.sign(
      { userId: id, username: login, email, githubToken: access_token },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Initialize user storage if not exists
    if (!userStorage.has(id)) {
      userStorage.set(id, {
        userId: id,
        username: login,
        email,
        githubToken: access_token,
        provider: 'github-models',
      });
    } else {
      // Update GitHub token
      const userData = userStorage.get(id);
      userData.githubToken = access_token;
      userStorage.set(id, userData);
    }

    // Redirect to Tauri app with token
    res.redirect(`http://localhost:1420/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

// OpenAI OAuth - Get authorization URL
app.get('/auth/openai/url', (req, res) => {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store PKCE verifier with state
  pkceStorage.set(state, { codeVerifier, timestamp: Date.now() });

  // Clean old PKCE entries (older than 10 minutes)
  for (const [key, value] of pkceStorage.entries()) {
    if (Date.now() - value.timestamp > 10 * 60 * 1000) {
      pkceStorage.delete(key);
    }
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OPENAI_CLIENT_ID,
    redirect_uri: OPENAI_CALLBACK_URL,
    scope: 'openid profile email offline_access',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state: state,
    id_token_add_organizations: 'true',
    codex_cli_simplified_flow: 'true',
    originator: 'pi',
  });

  const authorizeUrl = `${OPENAI_AUTHORIZE_URL}?${params.toString()}`;

  res.json({ url: authorizeUrl, state });
});

// OpenAI OAuth - Callback (using standard /auth/callback path like openclaw)
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Authorization code or state not provided');
  }

  // Retrieve PKCE verifier
  const pkceData = pkceStorage.get(state);
  if (!pkceData) {
    return res.status(400).send('Invalid state or session expired');
  }

  const { codeVerifier } = pkceData;
  pkceStorage.delete(state); // Clean up

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      OPENAI_TOKEN_URL,
      new URLSearchParams({
        client_id: OPENAI_CLIENT_ID,
        code: code,
        redirect_uri: OPENAI_CALLBACK_URL,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, id_token } = tokenResponse.data;

    // Decode ID token to get user info (JWT)
    const idTokenPayload = JSON.parse(
      Buffer.from(id_token.split('.')[1], 'base64').toString()
    );

    const userId = idTokenPayload.sub;
    const email = idTokenPayload.email;
    const name = idTokenPayload.name || idTokenPayload.email;

    // Create JWT token
    const jwtToken = jwt.sign(
      { userId, username: name, email, provider: 'openai' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Store user data
    userStorage.set(userId, {
      userId,
      username: name,
      email,
      openaiAccessToken: access_token,
      openaiRefreshToken: refresh_token,
      provider: 'openai',
      tokenExpiry: Date.now() + 3600 * 1000, // 1 hour
    });

    // Redirect to Tauri app with token
    res.redirect(`http://localhost:1420/auth/callback?token=${jwtToken}&provider=openai`);
  } catch (error) {
    console.error('OpenAI OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed: ' + (error.response?.data?.error_description || error.message));
  }
});

// OpenAI - Refresh access token
async function refreshOpenAIToken(userId) {
  const userData = userStorage.get(userId);
  if (!userData || !userData.openaiRefreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const tokenResponse = await axios.post(
      OPENAI_TOKEN_URL,
      new URLSearchParams({
        client_id: OPENAI_CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: userData.openaiRefreshToken,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Update stored tokens
    userData.openaiAccessToken = access_token;
    if (refresh_token) {
      userData.openaiRefreshToken = refresh_token;
    }
    userData.tokenExpiry = Date.now() + 3600 * 1000; // 1 hour
    userStorage.set(userId, userData);

    return access_token;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw error;
  }
}

// Exchange code for token (for Tauri deep linking)
app.post('/auth/exchange', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Code required' });
  }

  try {
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const { access_token } = tokenResponse.data;

    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const { id, login, email } = userResponse.data;

    const jwtToken = jwt.sign(
      { userId: id, username: login, email, githubToken: access_token },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    if (!userStorage.has(id)) {
      userStorage.set(id, {
        userId: id,
        username: login,
        email,
        githubToken: access_token,
        provider: 'github-models',
      });
    } else {
      // Update GitHub token
      const userData = userStorage.get(id);
      userData.githubToken = access_token;
      userStorage.set(id, userData);
    }

    res.json({ token: jwtToken, user: { id, username: login, email } });
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get user profile
app.get('/api/user', authenticateToken, (req, res) => {
  const userData = userStorage.get(req.user.userId);

  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Don't send tokens to client
  res.json({
    userId: userData.userId,
    username: userData.username,
    email: userData.email,
    provider: userData.provider,
    hasGitHubToken: !!userData.githubToken,
    hasOpenAIToken: !!userData.openaiAccessToken,
    isConfigured: !!(userData.githubToken || userData.openaiAccessToken), // AI ready to use
  });
});

// Select AI provider (GitHub Models supports multiple models)
app.post('/api/provider', authenticateToken, (req, res) => {
  const { model } = req.body; // 'gpt-4o', 'claude-3.5-sonnet', etc.

  const userData = userStorage.get(req.user.userId);

  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  userData.selectedModel = model || 'gpt-4o';
  userStorage.set(req.user.userId, userData);

  res.json({ success: true, model: userData.selectedModel });
});

// AI request using GitHub Models API or OpenAI OAuth
app.post('/api/ai/request', authenticateToken, async (req, res) => {
  const { prompt, context, maxTokens, temperature } = req.body;

  const userData = userStorage.get(req.user.userId);

  if (!userData) {
    return res.status(404).json({ error: 'User not found' });
  }

  console.log('User data:', {
    provider: userData.provider,
    hasOpenAIToken: !!userData.openaiAccessToken,
    hasGitHubToken: !!userData.githubToken
  });

  try {
    // Check which provider to use
    if (userData.provider === 'openai' && userData.openaiAccessToken) {
      // Use OpenAI OAuth token
      let accessToken = userData.openaiAccessToken;

      // Check if token expired
      if (userData.tokenExpiry && Date.now() >= userData.tokenExpiry) {
        console.log('OpenAI token expired, refreshing...');
        accessToken = await refreshOpenAIToken(req.user.userId);
      }

      // Build messages
      const messages = [];
      if (context) {
        messages.push({ role: 'system', content: context });
      }
      messages.push({ role: 'user', content: prompt });

      // Call OpenAI API with OAuth token
      // Using standard OpenAI API endpoint (works with OAuth tokens)
      // gpt-4 or gpt-4-turbo for high-quality writing
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo-preview',
          messages: messages,
          max_tokens: maxTokens || 2048,
          temperature: temperature || 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = {
        text: response.data.choices[0]?.message?.content || '',
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };

      return res.json(aiResponse);
    } else {
      // Use GitHub Models API (default)
      const githubToken = userData.githubToken || req.user.githubToken;

      if (!githubToken) {
        return res.status(400).json({ error: 'No AI token found. Please login.' });
      }

      const model = userData.selectedModel || 'gpt-4o';

      // Build messages
      const messages = [];
      if (context) {
        messages.push({ role: 'system', content: context });
      }
      messages.push({ role: 'user', content: prompt });

      // Call GitHub Models API
      const response = await axios.post(
        'https://models.inference.ai.azure.com/chat/completions',
        {
          model: model,
          messages: messages,
          max_tokens: maxTokens || 2048,
          temperature: temperature || 0.7,
        },
        {
          headers: {
            'Authorization': `Bearer ${githubToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = {
        text: response.data.choices[0]?.message?.content || '',
        usage: response.data.usage ? {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };

      return res.json(aiResponse);
    }
  } catch (error) {
    console.error('AI API error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'AI request failed',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

// Start main server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 GitHub OAuth callback: ${GITHUB_CALLBACK_URL}`);
});

// Start OAuth callback server on port 1455 (for OpenAI Codex compatibility)
const callbackApp = express();
callbackApp.use(cors({
  origin: ['http://localhost:1420', 'tauri://localhost'],
  credentials: true
}));
callbackApp.use(express.json());

// Use the same callback handler
callbackApp.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Authorization code or state not provided');
  }

  // Retrieve PKCE verifier from main app's storage
  const pkceData = pkceStorage.get(state);
  if (!pkceData) {
    return res.status(400).send('Invalid state or session expired');
  }

  const { codeVerifier } = pkceData;
  pkceStorage.delete(state);

  try {
    const tokenResponse = await axios.post(
      OPENAI_TOKEN_URL,
      new URLSearchParams({
        client_id: OPENAI_CLIENT_ID,
        code: code,
        redirect_uri: OPENAI_CALLBACK_URL,
        grant_type: 'authorization_code',
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, id_token } = tokenResponse.data;

    const idTokenPayload = JSON.parse(
      Buffer.from(id_token.split('.')[1], 'base64').toString()
    );

    const userId = idTokenPayload.sub;
    const email = idTokenPayload.email;
    const name = idTokenPayload.name || idTokenPayload.email;

    const jwtToken = jwt.sign(
      { userId, username: name, email, provider: 'openai' },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    userStorage.set(userId, {
      userId,
      username: name,
      email,
      openaiAccessToken: access_token,
      openaiRefreshToken: refresh_token,
      provider: 'openai',
      tokenExpiry: Date.now() + 3600 * 1000,
    });

    res.redirect(`http://localhost:1420/auth/callback?token=${jwtToken}&provider=openai`);
  } catch (error) {
    console.error('OpenAI OAuth error:', error.response?.data || error.message);
    res.status(500).send('Authentication failed: ' + (error.response?.data?.error_description || error.message));
  }
});

callbackApp.listen(1455, () => {
  console.log(`🔐 OpenAI OAuth callback server running on http://localhost:1455`);
  console.log(`📍 OpenAI OAuth callback: ${OPENAI_CALLBACK_URL}`);
});
