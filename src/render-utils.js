export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Strip legacy production notes, never substantive viewing pointers or upload dates.
export function highlightNote(value) {
  const boilerplate = [
    /^(?:\d{4}\s+Week\s+\d+\s+)?전체 경기 하이라이트다\.?$/i,
    /특정 플레이의 시작 시점을 지정한 링크가 아니다/,
    /^영상은 해당 장면 바로가기가 아닌 전체 경기 하이라이트다/,
    /^오늘 공개판에서 유지한 공식 영상/,
    /^이번 조사에서는 oEmbed/,
    /^실제 운영 시에는/,
    /^새 경기 영상이 아니라 기존 경기의 검증된 하이라이트/,
  ];
  return String(value ?? '').split(/(?<=[.!?])\s+/u)
    .filter(sentence => !boilerplate.some(pattern => pattern.test(sentence.trim())))
    .join(' ').trim();
}

export function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' ? url.href : '#';
  } catch {
    return '#';
  }
}
