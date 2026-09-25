/**
 * User Profile & Authorization Service
 * Manages user identity, display name, research role, and authorization credentials.
 */

export interface UserProfile {
  displayName: string;
  email: string;
  roleTitle: string;
  organization: string;
  photoURL?: string;
  authorizationType: 'google_oauth' | 'session_enclave' | 'guest';
}

const PROFILE_STORAGE_KEY = 'breezy_user_profile';

export const userProfileService = {
  getProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          displayName: parsed.displayName || 'Pranav B',
          email: parsed.email || 'bpranav763@gmail.com',
          roleTitle: parsed.roleTitle || 'Principal Systems Engineer',
          organization: parsed.organization || 'Breezy Research Lab',
          photoURL: parsed.photoURL || undefined,
          authorizationType: parsed.authorizationType || 'session_enclave',
        };
      }
    } catch {}

    return {
      displayName: 'Pranav B',
      email: 'bpranav763@gmail.com',
      roleTitle: 'Principal Systems Engineer',
      organization: 'Breezy Research Lab',
      authorizationType: 'session_enclave',
    };
  },

  saveProfile(profile: Partial<UserProfile>): UserProfile {
    const current = this.getProfile();
    const updated: UserProfile = { ...current, ...profile };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save user profile:', e);
    }
    return updated;
  },
};
