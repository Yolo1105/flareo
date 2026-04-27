import { z } from "zod";

/**
 * Reserved usernames. Cannot be claimed — these are app route names,
 * common API paths, and a handful of generic terms we want to keep
 * available for future product use.
 *
 * List is maintained here rather than in the DB so adding a reserved
 * word doesn't need a migration. Check is case-insensitive.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  // Route namespace — anything that appears as a top-level path on
  // flareo.dev. Keep in sync with app/ directory's top-level routes.
  "admin",
  "api",
  "app",
  "catalog",
  "docs",
  "login",
  "logout",
  "modules",
  "privacy",
  "publish",
  "pricing",
  "settings",
  "signin",
  "signup",
  "submissions",
  "terms",
  "verify",
  "workers",
  // Handles we want to keep available for future product features.
  "flareo",
  "official",
  "support",
  "help",
  "team",
  "about",
  "blog",
  "contact",
  "status",
  "security",
  // First-person pronouns / generic identifiers that would read
  // weird as a profile URL (e.g. /@me).
  "me",
  "you",
  "us",
  "we",
  "system",
  "null",
  "undefined",
  "anonymous",
]);

/**
 * The username shape regex. Matches the module-slug format so users'
 * mental model stays consistent:
 *   - lowercase alphanumeric + dashes
 *   - first char must be alphanumeric (no leading dash)
 *   - 3-30 characters total
 *
 * Trailing dash is permitted by the regex but disallowed by an
 * additional check in `isValidUsername` below — the regex alone would
 * need a lookbehind which isn't supported in all regex engines.
 */
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9-]{2,29}$/;

/**
 * Returns an error string if the candidate is invalid, or null if it
 * passes all checks. Checks are ordered cheap-to-expensive so the
 * caller gets the most actionable message first.
 *
 * Does NOT check global uniqueness — that's a DB lookup the caller
 * runs separately (see API route).
 */
export function usernameError(raw: string): string | null {
  const candidate = raw.trim().toLowerCase();
  if (!candidate) return "Username cannot be empty.";
  if (candidate.length < 3)
    return "Username must be at least 3 characters.";
  if (candidate.length > 30)
    return "Username must be 30 characters or fewer.";
  if (!USERNAME_REGEX.test(candidate))
    return "Username must be lowercase letters, numbers, or dashes; starting with a letter or number.";
  if (candidate.endsWith("-"))
    return "Username can't end with a dash.";
  if (candidate.includes("--"))
    return "Username can't contain consecutive dashes.";
  if (RESERVED_USERNAMES.has(candidate))
    return "This username is reserved; try a different one.";
  return null;
}

/**
 * Zod schema building on usernameError — suitable for API request
 * bodies. Applies the same checks with proper Zod error reporting.
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((v) => usernameError(v) === null, {
    message: "invalid username",
  });

/**
 * Zod schema for the bio field. 0-500 chars, plain text.
 */
export const bioSchema = z.string().trim().max(500).optional();

/**
 * Zod schema for websiteUrl — http(s) URLs only, reasonable length.
 */
export const websiteUrlSchema = z
  .string()
  .trim()
  .url()
  .max(200)
  .refine((v) => v.startsWith("http://") || v.startsWith("https://"), {
    message: "Website URL must use http or https.",
  })
  .optional();
