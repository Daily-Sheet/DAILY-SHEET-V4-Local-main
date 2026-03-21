const rawApiUrl = (import.meta.env.VITE_API_URL ?? "").trim();
const trimmedApiUrl = rawApiUrl.replace(/\/+$/, "");

export function buildApiUrl(path: string) {
  const pathClean = path.trim();
  const normalizedPath = pathClean.startsWith("/") ? pathClean : `/${pathClean}`;

  if (!trimmedApiUrl) {
    return normalizedPath;
  }

  if (trimmedApiUrl.endsWith("/api") && normalizedPath.startsWith("/api")) {
    return `${trimmedApiUrl}${normalizedPath.substring(4)}`; // avoid /api/api
  }

  return `${trimmedApiUrl}${normalizedPath}`;
}
