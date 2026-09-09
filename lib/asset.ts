/** Prefix public asset URLs so they resolve under GitHub Pages (`/ntd-gurd/...`). */
export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const normalised = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalised}`;
}
