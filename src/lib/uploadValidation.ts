// Defence against path-traversal via user-supplied filenames in storage paths.
// Replace anything that isn't safe in a URL/path with an underscore.
export function sanitiseFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

// Default upload constraints. Individual call sites may pass tighter values.
export const DEFAULT_MAX_BYTES = 5_000_000; // 5 MB
export const DEFAULT_IMAGE_MIME = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

export function assertUploadAllowed(
  file: File,
  opts?: { maxBytes?: number; allowedMime?: string[] }
): void {
  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
  const allowed = opts?.allowedMime ?? DEFAULT_IMAGE_MIME;
  if (file.size > maxBytes) {
    throw new Error(`File too large: ${(file.size / 1_000_000).toFixed(1)} MB (max ${(maxBytes / 1_000_000).toFixed(0)} MB)`);
  }
  if (!allowed.includes(file.type)) {
    throw new Error(`File type ${file.type || 'unknown'} not allowed (allowed: ${allowed.join(', ')})`);
  }
}
