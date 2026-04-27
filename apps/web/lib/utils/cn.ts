/**
 * Minimal classname helper — joins truthy strings.
 * We don't pull in clsx / tailwind-merge to keep the dep tree flat.
 */
export function cn(
  ...args: Array<string | false | null | undefined>
): string {
  return args.filter(Boolean).join(" ");
}
