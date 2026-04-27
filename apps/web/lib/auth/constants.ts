/**
 * Account-lifecycle constants. Single source of truth so a change
 * to the soft-delete window is one edit, not four.
 *
 * If you change SOFT_DELETE_GRACE_DAYS, also update:
 *   - The user-facing copy on /app/settings/delete (it's calculated
 *     from the constant, so this should "just work")
 *   - lib/db/account.ts JSDoc comment "purges rows where
 *     deletedAt < now - 30 days"
 *   - The nightly purge job's cutoff (when it ships)
 *   - PRIVACY_POLICY copy (currently says "30 days")
 */

/**
 * Days a soft-deleted account stays recoverable. After this window,
 * a nightly job hard-deletes the row.
 *
 * Why 30 days: matches Stripe's customer-deletion grace, matches
 * what most password-manager / SaaS products use, gives users
 * enough time to realize they made a mistake without keeping data
 * around indefinitely.
 */
export const SOFT_DELETE_GRACE_DAYS = 30;

/** Same value, in milliseconds, for arithmetic on Date objects. */
export const SOFT_DELETE_GRACE_MS = SOFT_DELETE_GRACE_DAYS * 24 * 3600 * 1000;
