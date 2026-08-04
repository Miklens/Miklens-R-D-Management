/**
 * Utility to manage user custom uploaded profile photos globally across localStorage & Firestore
 */
const AVATAR_PREFIX = 'miklens_user_avatar_';

export const getUserCustomAvatar = (userIdOrEmail?: string): string | null => {
  if (!userIdOrEmail) return null;
  try {
    const key = `${AVATAR_PREFIX}${userIdOrEmail.trim().toLowerCase()}`;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setUserCustomAvatar = (userIdOrEmail: string, base64Data: string): void => {
  if (!userIdOrEmail) return;
  try {
    const key = `${AVATAR_PREFIX}${userIdOrEmail.trim().toLowerCase()}`;
    localStorage.setItem(key, base64Data);
    // Trigger storage event so all components update realtime
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to save user avatar:', err);
  }
};

export const removeUserCustomAvatar = (userIdOrEmail?: string): void => {
  if (!userIdOrEmail) return;
  try {
    const key = `${AVATAR_PREFIX}${userIdOrEmail.trim().toLowerCase()}`;
    localStorage.removeItem(key);
    window.dispatchEvent(new Event('storage'));
  } catch (err) {
    console.error('Failed to remove user avatar:', err);
  }
};

export const getEffectiveAvatar = (userId?: string, userEmail?: string, fallbackUrl?: string): string | null => {
  if (userEmail) {
    const custom = getUserCustomAvatar(userEmail);
    if (custom) return custom;
  }
  if (userId) {
    const custom = getUserCustomAvatar(userId);
    if (custom) return custom;
  }
  return fallbackUrl || null;
};
