/**
 * User Profile & Authorization Service (Synap Standalone Edition)
 */

export interface UserProfile {
  displayName: string;
  email: string;
  roleTitle: string;
  organization: string;
  photoURL?: string;
  authorizationType: 'google_oauth' | 'github_oauth' | 'session_enclave' | 'guest';
}

const PROFILE_STORAGE_KEY = 'synap_user_profile';

export const userProfileService = {
  getProfile(): UserProfile {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY) || localStorage.getItem('breezy_user_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          displayName: parsed.displayName || 'Synap Learner',
          email: parsed.email || 'learner@synap.local',
          roleTitle: parsed.roleTitle || 'Research Scholar',
          organization: parsed.organization || 'Synap Learning Workspace',
          photoURL: parsed.photoURL || undefined,
          authorizationType: parsed.authorizationType || 'guest',
        };
      }
    } catch {}

    return {
      displayName: 'Synap Learner',
      email: 'learner@synap.local',
      roleTitle: 'Research Scholar',
      organization: 'Synap Learning Workspace',
      authorizationType: 'guest',
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
