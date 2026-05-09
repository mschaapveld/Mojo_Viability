// Escape user-supplied strings before splicing them into HTML that will be
// rendered via `dangerouslySetInnerHTML`. Stops <script> tags, event handlers,
// and other HTML/attribute injections in freeform fields like business name,
// target market, owner names, etc.
export function escapeHtml(input: unknown): string {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
