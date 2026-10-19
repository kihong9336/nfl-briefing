// Resolve season-spanning MM/DD against the edition that actually observed it.
export function scheduleDate(game, editionDate) {
  const explicit = game.gameDate;
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicit ?? '')) return explicit;
  if (!/^\d{2}\/\d{2}$/.test(game.date ?? '')) return null;
  const year = Number(editionDate.slice(0, 4));
  const suffix = game.date.replace('/', '-');
  return [year - 1, year, year + 1].map(y => `${y}-${suffix}`)
    .filter(d => Number.isFinite(Date.parse(d)))
    .sort((a, b) => Math.abs(Date.parse(a) - Date.parse(editionDate)) - Math.abs(Date.parse(b) - Date.parse(editionDate)))[0];
}

const TEAM_ALIASES = {
  ari: 'cardinals', atl: 'falcons', bal: 'ravens', buf: 'bills', car: 'panthers', chi: 'bears', cin: 'bengals', cle: 'browns', dal: 'cowboys', den: 'broncos', det: 'lions', gb: 'packers', hou: 'texans', ind: 'colts', jax: 'jaguars', jac: 'jaguars', kc: 'chiefs', lv: 'raiders', lac: 'chargers', lar: 'rams', mia: 'dolphins', min: 'vikings', ne: 'patriots', no: 'saints', nyg: 'giants', nyj: 'jets', phi: 'eagles', pit: 'steelers', sf: '49ers', sea: 'seahawks', tb: 'buccaneers', ten: 'titans', was: 'commanders', wsh: 'commanders'
};
function matchupKey(matchup) {
  return String(matchup).toLowerCase().trim().split(/\s+(?:at|vs\.?|@)\s+/).map(team => {
    const words = team.trim().split(/\s+/);
    const nickname = words.at(-1);
    return TEAM_ALIASES[team.trim()] ?? (Object.values(TEAM_ALIASES).includes(nickname) ? nickname : words.join(' '));
  }).join('@');
}

export function carryForwardSchedule(history, input) {
  const result = structuredClone(input.schedule);
  const ids = new Set(result.map(g => g.gameId ?? g.id).filter(id => id !== undefined));
  const seen = new Set(result.map(g => `${scheduleDate(g, input.date)}:${matchupKey(g.matchup)}`));
  for (const edition of [...history].filter(e => e.sample === false && e.date < input.date).sort((a, b) => b.date.localeCompare(a.date))) {
    for (const game of edition.schedule ?? []) {
      const date = scheduleDate(game, edition.date);
      const key = `${date}:${matchupKey(game.matchup)}`;
      const id = game.gameId ?? game.id;
      const duplicate = seen.has(key) || (id !== undefined && ids.has(id));
      seen.add(key);
      if (id !== undefined) ids.add(id);
      if (duplicate) continue;
      if (!date || date < input.date || ['종료', '취소'].includes(game.status)) continue;
      const copy = structuredClone(game);
      copy.carriedForward = true;
      copy.lastConfirmedEdition = game.lastConfirmedEdition ?? edition.date;
      const verificationNote = `마지막 확인 ${copy.lastConfirmedEdition} 발행본 기준 · 이전 확인 일정 이월, 오늘 재검증하지 않음. 실제 경기 진행·최종 결과 미확인.`;
      copy.note = game.note.includes(verificationNote) ? game.note : `${game.note} ${verificationNote}`;
      result.push(copy);
    }
  }
  return result.sort((a, b) => `${scheduleDate(a, input.date)} ${a.time}`.localeCompare(`${scheduleDate(b, input.date)} ${b.time}`));
}
