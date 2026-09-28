// oxlint-disable no-console
import { type Role } from "@tans/db/schema";
// Placeholder for email sending function
export async function sendPasswordResetEmail(email: string, url: string) {
  console.log(`Sending password reset email to ${email} with URL: ${url}`);
}

export const CACHE_CONFIG = {
  ROLE_TTL: 30_000, // 30 seconds
  SESSION_TTL: 5000, // 5 seconds
  MAX_CACHE_SIZE: 1000,
  CLEANUP_INTERVAL: 60_000 // 1 minute
} as const;

// Cache for user role lookups
export const roleCache = new Map<
  string,
  { role: Role; timestamp: number; clinicId: string | null }
>();

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const cleanupCache = () => {
  const now = Date.now();

  // Clean role cache by TTL
  for (const [key, entry] of roleCache) {
    if (now - entry.timestamp > CACHE_CONFIG.ROLE_TTL) {
      roleCache.delete(key);
    }
  }

  // Enforce max cache size limit (LRU-style cleanup)
  if (roleCache.size > CACHE_CONFIG.MAX_CACHE_SIZE) {
    const entries = Array.from(roleCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, entries.length - CACHE_CONFIG.MAX_CACHE_SIZE);
    for (const [key] of toDelete) {
      roleCache.delete(key);
    }
  }
};

// Periodic background cleanup (unrefed so it doesn't block process exit)
if (typeof setInterval !== "undefined") {
  const interval = setInterval(cleanupCache, CACHE_CONFIG.CLEANUP_INTERVAL);
  if (typeof interval.unref === "function") {
    interval.unref();
  }
}
