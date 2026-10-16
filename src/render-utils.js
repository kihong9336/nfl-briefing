export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : '#';
  } catch {
    return '#';
  }
}
