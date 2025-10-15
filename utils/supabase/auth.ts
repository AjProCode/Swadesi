import { supabase } from './client';
import { projectId, publicAnonKey } from './info';
import { User } from '../../App';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server`;

// Fallback demo auth when server is unavailable
const DEMO_MODE_KEY = 'swadesi_demo_mode';
const DEMO_USERS_KEY = 'swadesi_demo_users';

// IMPROVEMENT: Add request timeout constant
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

const getDemoUsers = (): Record<string, { password: string; user: User }> => {
  const stored = localStorage.getItem(DEMO_USERS_KEY);
  return stored ? JSON.parse(stored) : {};
};

const saveDemoUsers = (users: Record<string, { password: string; user: User }>) => {
  localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
};

const generateDemoToken = (email: string): string => {
  return `demo_token_${btoa(email)}_${Date.now()}`;
};

const createDemoUser = (email: string, name: string, phone: string): User => {
  return {
    id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    name,
    phone,
    points: 100,
    pointsLifetime: 100,
    pointsTier: 'bronze',
    level: 1,
    streakDays: 0,
    lastLoginDate: new Date(),
    achievements: [],
    completedChallenges: [],
    weeklyProgress: {},
    dailyLoginCount: 0,
    referralCount: 0,
    reviewCount: 0,
    billUploadCount: 0,
    totalSpent: 0,
    favoriteProducts: [],
    wishlist: [],
    recentSearches: []
  };
};

// IMPROVEMENT: Add timeout wrapper for fetch requests
const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs: number = REQUEST_TIMEOUT_MS): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - server did not respond in time');
    }
    throw error;
  }
};

export const signUp = async (email: string, password: string, name: string, phone: string): Promise<User> => {
  try {
    const response = await fetchWithTimeout(`${SERVER_URL}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password, name, phone })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Signup API error:', data);
      throw new Error(data.error || 'Signup failed');
    }

    // Store access token if provided (new users get auto-signed in)
    if (data.access_token) {
      localStorage.setItem('supabase_access_token', data.access_token);
      console.log('✅ Access token stored successfully for signup');
    } else {
      console.log('ℹ️ No access token received from signup - user will need to sign in manually');
      if (data.message) {
        console.log('Server message:', data.message);
      }
    }

    return data.profile;
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Fallback to demo mode if server is unavailable
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('timeout'))) {
      console.warn('⚠️ Server unavailable, using demo mode for signup');
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      
      const demoUsers = getDemoUsers();
      
      // Check if user already exists
      if (demoUsers[email]) {
        throw new Error('An account with this email already exists');
      }
      
      // Create demo user
      const user = createDemoUser(email, name, phone);
      demoUsers[email] = { password, user };
      saveDemoUsers(demoUsers);
      
      // Generate and store demo token
      const token = generateDemoToken(email);
      localStorage.setItem('supabase_access_token', token);
      
      console.log('✅ Demo account created successfully');
      return user;
    }
    
    throw new Error(error.message || 'Signup failed');
  }
};

export const signIn = async (email: string, password: string): Promise<{ user: User; accessToken: string }> => {
  try {
    console.log('🔐 Signing in user with email:', email);
    
    const response = await fetchWithTimeout(`${SERVER_URL}/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Sign in API error:', data);
      throw new Error(data.error || 'Sign in failed');
    }

    // Store access token in localStorage
    if (data.access_token) {
      localStorage.setItem('supabase_access_token', data.access_token);
      console.log('✅ Access token stored successfully for signin');
    } else {
      console.error('❌ No access token received from signin');
    }

    return {
      user: data.profile,
      accessToken: data.access_token
    };
  } catch (error: any) {
    console.error('Sign in error:', error);
    
    // Fallback to demo mode if server is unavailable
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('timeout'))) {
      console.warn('⚠️ Server unavailable, using demo mode for signin');
      localStorage.setItem(DEMO_MODE_KEY, 'true');
      
      const demoUsers = getDemoUsers();
      const userRecord = demoUsers[email];
      
      if (!userRecord) {
        throw new Error('No account found with this email. Please sign up first.');
      }
      
      if (userRecord.password !== password) {
        throw new Error('Incorrect password');
      }
      
      // Generate and store demo token
      const token = generateDemoToken(email);
      localStorage.setItem('supabase_access_token', token);
      
      // Update last login date
      userRecord.user.lastLoginDate = new Date();
      saveDemoUsers(demoUsers);
      
      console.log('✅ Demo signin successful');
      return {
        user: userRecord.user,
        accessToken: token
      };
    }
    
    throw new Error(error.message || 'Sign in failed');
  }
};

export const signOut = async (): Promise<void> => {
  try {
    // Clear local storage
    localStorage.removeItem('supabase_access_token');
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
  } catch (error: any) {
    console.error('Sign out error:', error);
    // Don't throw error on signout - always clear local token
    localStorage.removeItem('supabase_access_token');
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const accessToken = localStorage.getItem('supabase_access_token');
    if (!accessToken) {
      return null;
    }

    // Check if in demo mode
    const isDemoMode = localStorage.getItem(DEMO_MODE_KEY) === 'true';
    if (isDemoMode && accessToken.startsWith('demo_token_')) {
      // Extract email from demo token
      const tokenParts = accessToken.split('_');
      if (tokenParts.length >= 3) {
        try {
          const email = atob(tokenParts[2]);
          const demoUsers = getDemoUsers();
          const userRecord = demoUsers[email];
          
          if (userRecord) {
            console.log('✅ Retrieved demo user from token');
            return userRecord.user;
          }
        } catch (e) {
          console.error('Error parsing demo token:', e);
        }
      }
      
      // Invalid demo token
      localStorage.removeItem('supabase_access_token');
      return null;
    }

    const response = await fetchWithTimeout(`${SERVER_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid, clear it
        localStorage.removeItem('supabase_access_token');
        return null;
      }
      throw new Error('Failed to get current user');
    }

    const userData = await response.json();
    return userData;
  } catch (error: any) {
    console.error('Get current user error:', error);
    
    // If server is unavailable, check for demo mode
    if (error.message && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('timeout'))) {
      const accessToken = localStorage.getItem('supabase_access_token');
      if (accessToken && accessToken.startsWith('demo_token_')) {
        const tokenParts = accessToken.split('_');
        if (tokenParts.length >= 3) {
          try {
            const email = atob(tokenParts[2]);
            const demoUsers = getDemoUsers();
            const userRecord = demoUsers[email];
            
            if (userRecord) {
              console.log('✅ Retrieved demo user (fallback)');
              localStorage.setItem(DEMO_MODE_KEY, 'true');
              return userRecord.user;
            }
          } catch (e) {
            console.error('Error parsing demo token:', e);
          }
        }
      }
    }
    
    return null;
  }
};

export const getAccessToken = (): string | null => {
  return localStorage.getItem('supabase_access_token');
};

// IMPROVEMENT: Add token validation function
export const testAccessToken = async (): Promise<boolean> => {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch {
    return false;
  }
};

// Admin function to delete a user (for cleaning up test accounts)
export const deleteUserByEmail = async (email: string): Promise<void> => {
  try {
    const response = await fetchWithTimeout(`${SERVER_URL}/admin/user/${encodeURIComponent(email)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Delete failed' }));
      throw new Error(errorData.error || 'Failed to delete user');
    }

    console.log('✅ User deleted successfully');
  } catch (error: any) {
    console.error('Delete user error:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};
