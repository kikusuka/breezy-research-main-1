/**
 * Firebase Authentication Service
 * Provides real Google OAuth authentication with Workspace scopes
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with exact applet config
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Add Workspace scopes for live integrations
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/documents.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// In-memory token cache
let cachedAccessToken: string | null = null;

export const authService = {
  /**
   * Sign in with Google popup and retrieve access token
   */
  async signInWithGoogle(): Promise<{ user: AuthUser; accessToken: string } | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      cachedAccessToken = credential?.accessToken || null;
      
      // Store in sessionStorage to persist across session reloads (safe preview behavior)
      if (cachedAccessToken) {
        sessionStorage.setItem('synthexis_g_token', cachedAccessToken);
      }

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        accessToken: cachedAccessToken || ''
      };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw new Error(error.code === 'auth/popup-closed-by-user' 
        ? 'Sign-in cancelled' 
        : 'Failed to sign in with Google');
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      cachedAccessToken = null;
      sessionStorage.removeItem('synthexis_g_token');
    } catch (error: any) {
      console.error('Sign-out error:', error);
      throw new Error('Failed to sign out');
    }
  },

  /**
   * Listen for auth state changes
   */
  onAuthChange(callback: (user: AuthUser | null, token: string | null) => void): () => void {
    return onAuthStateChanged(auth, (firebaseUser) => {
      // Restore token from sessionStorage if present
      if (!cachedAccessToken) {
        cachedAccessToken = sessionStorage.getItem('synthexis_g_token');
      }

      if (firebaseUser) {
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        }, cachedAccessToken);
      } else {
        callback(null, null);
      }
    });
  },

  /**
   * Get cached access token
   */
  getAccessToken(): string | null {
    if (!cachedAccessToken) {
      cachedAccessToken = sessionStorage.getItem('synthexis_g_token');
    }
    return cachedAccessToken;
  },

  /**
   * Manually set access token
   */
  setAccessToken(token: string | null) {
    cachedAccessToken = token;
    if (token) {
      sessionStorage.setItem('synthexis_g_token', token);
    } else {
      sessionStorage.removeItem('synthexis_g_token');
    }
  },

  /**
   * Get current user synchronously
   */
  getCurrentUser(): AuthUser | null {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified
    };
  },

  /**
   * Sign in with GitHub popup and retrieve access token
   */
  async signInWithGithub(): Promise<{ user: AuthUser; accessToken: string } | null> {
    try {
      const githubProvider = new GithubAuthProvider();
      githubProvider.addScope('repo');
      githubProvider.addScope('read:org');
      
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        localStorage.setItem('synthexis_github_token', token);
      }

      return {
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          emailVerified: user.emailVerified
        },
        accessToken: token || ''
      };
    } catch (error: any) {
      console.error('GitHub sign-in error:', error);
      throw new Error(error.code === 'auth/popup-closed-by-user'
        ? 'Sign-in cancelled'
        : 'Failed to sign in with GitHub OAuth');
    }
  }
};

export { auth };
