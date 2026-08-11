/**
 * Single source for the user-visible product version.
 * Keep in sync with apps/web/package.json (and the monorepo root).
 */
import packageJson from "../package.json";

export const FLAREO_VERSION: string = packageJson.version;
