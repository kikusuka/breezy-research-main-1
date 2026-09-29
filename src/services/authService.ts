/**
 * Firebase Authentication Service
 * Provides real Google and GitHub OAuth authentication with incremental and narrow scopes
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

let firebaseConfig: any = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

// If no environment variables are set, fallback to imported JSON if available
if (!firebaseConfig.apiKey) {
  try {
    // @ts-ignore
    const fileConfig = (await import('../../firebase-applet-config.json')).default;
    firebaseConfig = { ...firebaseConfig, ...fileConfig };
  } catch (e) {
    // Left unconfigured (empty strings) rather than loading faked placeholders
    firebaseConfig = {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: ""
    };
  }
}

// Ensure clean check of whether Firebase config is real and fully initialized
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('Placeholder') && 
  !firebaseConfig.apiKey.includes('MockKey')
);

// Initialize Firebase only if config is real and available
let app: any = null;
let auth: any = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  // Safe mock auth interface to prevent crashes when other pages/scripts import/reference auth
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback: any) => {
      callback(null);
      return () => {};
    },
    signOut: async () => {}
  };
}

// Google provider with basic profile scopes only upfront
const googleProvider = new GoogleAuthProvider();
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
   * Sign in with Google popup (basic profile scopes only)
   */
  async signInWithGoogle(): Promise<{ user: AuthUser; accessToken: string } | null> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase Authentication is unconfigured.');
    }
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const credential = GoogleAuthProvider.credentialFromResult(result);
      cachedAccessToken = credential?.accessToken || null;
      
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
   * Request incremental Google Workspace scopes (Drive, Gmail, Calendar, Docs, Sheets) when the user opens the feature
   */
  async requestWorkspaceScopes(scopes: string[]): Promise<string | null> {
    if (!isFirebaseConfigured) {
      return null;
    }
    try {
      const incrementalProvider = new GoogleAuthProvider();
      for (const scope of scopes) {
        incrementalProvider.addScope(scope);
      }
      incrementalProvider.setCustomParameters({ prompt: 'consent' });

      const result = await signInWithPopup(auth, incrementalProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      if (token) {
        cachedAccessToken = token;
        sessionStorage.setItem('synthexis_g_token', token);
      }
      return token;
    } catch (error: any) {
      console.error('Incremental scope request error:', error);
      return null;
    }
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!isFirebaseConfigured) {
      cachedAccessToken = null;
      sessionStorage.removeItem('synthexis_g_token');
      return;
    }
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
    if (!isFirebaseConfigured) {
      callback(null, null);
      return () => {};
    }
    return onAuthStateChanged(auth, (firebaseUser) => {
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
    if (!isFirebaseConfigured) {
      return null;
    }
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
   * Sign in with GitHub popup using the narrowest scope (public_repo instead of full repo)
   */
  async signInWithGithub(): Promise<{ user: AuthUser; accessToken: string } | null> {
    if (!isFirebaseConfigured) {
      throw new Error('Firebase Authentication is unconfigured.');
    }
    try {
      const githubProvider = new GithubAuthProvider();
      githubProvider.addScope('public_repo');
      githubProvider.addScope('read:user');
      
      const result = await signInWithPopup(auth, githubProvider);
      const user = result.user;
      const credential = GithubAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        localStorage.setItem('breezy_github_token', token);
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
